import { retrieveForChat, rerankChunks } from "@/lib/vector-store";
import { getSiteConfig } from "@/lib/site-config";
import { recordUsage } from "@/lib/usage-tracker";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import Chat from "@/models/chat";
import Message from "@/models/message";
import User from "@/models/user";
import connectToDB from "@/utils/database";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { createDataStreamResponse, smoothStream, streamText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";

const pinecone = new PineconeClient();
const google = createGoogleGenerativeAI();
const DAILY_TOKEN_LIMIT = 50_000;
const CHAT_MODEL = "gemini-2.5-flash";
const RERANK_MODEL = "gemini-2.5-flash";
const EMBED_MODEL = "text-embedding-3-small";

// Resolve the set of source IDs the chat should retrieve from. Accepts the
// new `boardgame_ids` array OR the legacy single `boardgame_id` string for
// backward compatibility. Loads each game's title + embed_version so the
// retrieval + prompt layers can branch on pipeline version.
async function resolveSources({ boardgame_ids, boardgame_id }) {
  const ids = Array.isArray(boardgame_ids) && boardgame_ids.length > 0
    ? boardgame_ids
    : boardgame_id
      ? [boardgame_id]
      : [];

  const objectIds = ids.filter((id) => mongoose.isValidObjectId(id));
  if (objectIds.length === 0) return [];

  const [boardgames, expansions] = await Promise.all([
    Boardgame.find({ _id: { $in: objectIds } }, "title embed_version is_expansion parent_id").lean(),
    Expansion.find({ _id: { $in: objectIds } }, "title embed_version parent_id").lean(),
  ]);

  const all = [
    ...boardgames.map((g) => ({ id: g._id.toString(), title: g.title, embed_version: g.embed_version || 1, kind: "boardgame" })),
    ...expansions.map((g) => ({ id: g._id.toString(), title: g.title, embed_version: g.embed_version || 1, kind: "expansion" })),
  ];

  // Preserve the order the client sent
  const order = new Map(ids.map((id, i) => [id, i]));
  all.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return all;
}

function formatLegendBlock(legendChunks) {
  if (!legendChunks?.length) return "";
  // Group by source title
  const grouped = new Map();
  for (const c of legendChunks) {
    const title = c.bg_title || "Source";
    if (!grouped.has(title)) grouped.set(title, []);
    grouped.get(title).push(c);
  }
  const blocks = [];
  for (const [title, chunks] of grouped) {
    blocks.push(`## Iconography — ${title}\n${chunks.map((c) => c.text).join("\n\n")}`);
  }
  return blocks.join("\n\n");
}

// `[WOOD]`, `[VP]`, `[SHEEP]` etc. — bracketed ALL-CAPS tokens that mean "icon".
// We use this to decide whether to include the iconography legend in the
// system prompt. If the user's question and the retrieved chunks contain no
// such tokens, the legend is dead weight (100–800 tokens) and we skip it.
const ICON_TOKEN_RE = /\[[A-Z][A-Z0-9_]*\]/;
function needsIconLegend(question, chunks) {
  if (ICON_TOKEN_RE.test(question)) return true;
  for (const c of chunks) {
    if (c.text && ICON_TOKEN_RE.test(c.text)) return true;
  }
  return false;
}

function formatSourceContext(chunks, sources) {
  // Build a name lookup so we can label v1 chunks (which lack bg_title metadata).
  const titleById = new Map(sources.map((s) => [s.id, s.title]));
  return chunks
    .map((c, i) => {
      const sourceTitle = c.bg_title || titleById.get(c.bg_id) || "Source";
      const breadcrumb = c.breadcrumb || null;
      const scopeLabel =
        c.scope === "variant" && c.variantName
          ? `[Variant: ${c.variantName}]`
          : null;
      const pageLabel = c.page ? `(p.${c.page})` : null;

      const header = [
        `Source [${i + 1}] — ${sourceTitle}`,
        breadcrumb,
        pageLabel,
        scopeLabel,
      ]
        .filter(Boolean)
        .join(" · ");
      return `### ${header}\n${c.text}`;
    })
    .join("\n\n");
}

function buildSystemPrompt({ sources, unloadedTitles, legendBlock, contextBlock }) {
  const sourceList = sources.map((s) => s.title).join(", ") || "this board game";
  const multiSource = sources.length > 1;

  // Override rule only when relevant — single-source chats don't need it.
  const overrideLine = multiSource
    ? `\nMULTI-SOURCE: When sources cover the same topic, state the base rule first, then "In <Expansion>: <override>". Never blend. Label variant rules "Variant: <name>".`
    : "";

  // Unloaded-source guard only when there are unloaded sources to refuse.
  const unloadedLine = unloadedTitles?.length
    ? `\nUNLOADED (refuse if asked by name, do not use training data): ${unloadedTitles.join(", ")}. Respond: "That source isn't loaded in this chat. Open the side panel and check the box for <name> to enable it." Then stop.`
    : "";

  // Icon-token rule only when the legend is present — otherwise dead weight.
  const iconLine = legendBlock
    ? `\nICONS: Replace bracketed icon tokens (e.g. [WOOD], [VP]) with their plain-English name from the Iconography section. Numeric citations [1], [2], [3] must stay.`
    : "";

  const legendSection = legendBlock ? `\n\nIconography:\n${legendBlock}` : "";

  return `You are a board game rules assistant for: ${sourceList}.

RULES (follow strictly):
1. CONTEXT ONLY. Your only source of truth is the Context below. If a fact isn't in the Context, you don't know it — never fall back to training knowledge, even on a confident-sounding question.
2. CITE EVERY FACT. Append the matching source number in square brackets, e.g. "Players draw 5 cards [2]." Cite multiple when relevant: "[1][3]". Never cite a source for a fact it doesn't contain. No citation = no statement (say "I couldn't find that in the rulebook").
3. COMPLETE ANSWERS. Cover every step, branch, and condition. Include all numbers, costs, point values, and table data verbatim. Numbered lists for sequences, bullets for parallel options, prose for single facts. No filler ("Great question!", "Based on the rulebook…").
4. NOT FOUND. If the answer isn't in the Context: "I couldn't find that in the rulebook." Then suggest 1–2 related topics from the Context.
5. VAGUE QUESTIONS. If too broad ("how do I play?"): respond "That's a broad question — try asking something more specific, like:" + 2–3 examples drawn from the Context.
6. NEVER tell the user to consult the rulebook or an external resource.${overrideLine}${unloadedLine}${iconLine}${legendSection}

Context:
${contextBlock}`;
}

export async function POST(req) {
  const body = await req.json();
  const { messages, boardgame_title, unloaded_source_titles } = body;
  await connectToDB();

  const { userId } = await auth();
  let dbUser = null;
  let tokensUsedToday = 0;

  if (userId) {
    dbUser = await User.findOne({ clerk_id: userId });
    if (dbUser) {
      const todayMidnightUTC = new Date();
      todayMidnightUTC.setUTCHours(0, 0, 0, 0);
      const isNewDay = !dbUser.tokens_reset_at || dbUser.tokens_reset_at < todayMidnightUTC;
      if (isNewDay) {
        dbUser.tokens_used_today = 0;
        dbUser.tokens_reset_at = todayMidnightUTC;
        await dbUser.save();
      }
      tokensUsedToday = dbUser.tokens_used_today ?? 0;
      if (tokensUsedToday >= DAILY_TOKEN_LIMIT) {
        return NextResponse.json(
          { error: "token_limit", message: "You've reached your daily limit. It resets at midnight UTC." },
          { status: 429 }
        );
      }
    }
  }

  const sources = await resolveSources(body);
  if (sources.length === 0) {
    return NextResponse.json({ message: "No valid sources provided" }, { status: 400 });
  }

  const userQuestion = messages[messages.length - 1].content.trim();

  // Pull the admin-mutable tuning knobs (v2TopK, v2ScoreThreshold, rerankTopN).
  // Cached in-memory for 30 s so this isn't a hot-path Mongo hit.
  const siteConfig = await getSiteConfig();

  // Retrieve: vector search (v1 and/or v2 depending on each source's pipeline)
  // + always-on legend chunks for v2 sources.
  const { chunks: retrieved, legendChunks, embedUsage } = await retrieveForChat({
    client: pinecone,
    query: userQuestion,
    boardgames: sources,
    config: siteConfig,
  });

  if (embedUsage) {
    recordUsage({ purpose: "chat-embed", model: EMBED_MODEL, usage: embedUsage });
  }

  if ((!retrieved || retrieved.length === 0) && (!legendChunks || legendChunks.length === 0)) {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        const result = streamText({
          model: google("gemini-2.5-flash"),
          system: `You are a friendly board game assistant. The rulebook for "${boardgame_title || sources[0]?.title}" has not been uploaded yet, so you have no information to draw from. In one or two sentences, let the user know that no rulebook has been added for this game yet, so you can't answer their questions right now. Suggest they check back later or let an admin know.`,
          messages,
          temperature: 0,
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => (error instanceof Error ? error.message : String(error)),
    });
  }

  // Rerank with Gemini Flash — picks the top N most relevant for the actual
  // question, going beyond vector similarity. Falls back to top-by-score if
  // the model misbehaves.
  const rerankTopN = siteConfig.rerankTopN ?? 3;
  let rerankedChunks;
  if (retrieved.length > rerankTopN) {
    const { chunks: reranked, usage: rerankUsage } = await rerankChunks(
      userQuestion,
      retrieved,
      rerankTopN,
    );
    rerankedChunks = reranked;
    if (rerankUsage) {
      recordUsage({ purpose: "chat-rerank", model: RERANK_MODEL, usage: rerankUsage });
    }
  } else {
    rerankedChunks = retrieved;
  }

  // Only include the iconography legend when something in this query actually
  // touches a bracketed icon token — saves 100–800 prompt tokens on the
  // questions that don't need it (the majority for non-icon-heavy games).
  const legendBlock = needsIconLegend(userQuestion, rerankedChunks)
    ? formatLegendBlock(legendChunks)
    : "";
  const contextBlock = formatSourceContext(rerankedChunks, sources);
  // Defensive: ensure we only pass strings, and never list a title that's
  // also one of the active sources (e.g. if the frontend sent stale data).
  const activeTitles = new Set(sources.map((s) => s.title));
  const unloadedTitles = Array.isArray(unloaded_source_titles)
    ? unloaded_source_titles.filter((t) => typeof t === "string" && t && !activeTitles.has(t))
    : [];
  const system = buildSystemPrompt({ sources, unloadedTitles, legendBlock, contextBlock });

  // Cap conversation history. Older messages rarely matter for the current
  // question and they're the biggest variable input-token cost in long chats.
  // The slice keeps the most recent N (including the current question, which
  // is the last entry).
  const historyLimit = Math.max(1, siteConfig.historyMessageLimit ?? 6);
  const trimmedMessages = messages.slice(-historyLimit);

  try {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.writeData("initialized call");

        const result = streamText({
          model: google("gemini-2.5-flash"),
          system,
          messages: trimmedMessages,
          temperature: 0,
          frequencyPenalty: 0,
          presencePenalty: 0,
          maxRetries: 3,
          experimental_transform: smoothStream({
            delayInMs: 25,
            chunking: "word",
          }),
          onFinish({ usage }) {
            // Log the chat-answer token usage for the admin dashboard.
            recordUsage({ purpose: "chat-answer", model: CHAT_MODEL, usage });

            // Attach the full reranked chunk set as a message annotation so
            // the frontend can render citation pills with hover previews.
            dataStream.writeMessageAnnotation({
              type: "chunks",
              chunks: rerankedChunks.map((c, i) => ({
                id: i + 1,
                bg_id: c.bg_id,
                bg_title: c.bg_title,
                breadcrumb: c.breadcrumb,
                page: c.page,
                chunkType: c.chunkType,
                scope: c.scope,
                variantName: c.variantName,
                text: c.text,
                source: c.source,
              })),
            });

            // Legacy single-page annotation for v1 games (matches existing UI).
            const top = rerankedChunks[0];
            if (top?.page) {
              dataStream.writeMessageAnnotation({
                pageNumber: top.page,
                url: top.source ? `${top.source}#page=${top.page}` : null,
              });
            }

            dataStream.writeData("call completed");

            if (dbUser) {
              const used = usage?.totalTokens ?? 0;
              const newUsed = tokensUsedToday + used;
              const newRemaining = Math.max(0, DAILY_TOKEN_LIMIT - newUsed);
              User.findByIdAndUpdate(dbUser._id, {
                tokens_used_today: newUsed,
                tokens_reset_at: dbUser.tokens_reset_at,
              }).catch(console.error);
              dataStream.writeData({ type: "tokens", remaining: newRemaining });
            }
          },
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "failed" }, { status: 500 });
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const user_id = new URLSearchParams(url.searchParams).get("user_id");

  await connectToDB();
  const user = await User.findOne({ clerk_id: user_id });
  if (!user) return NextResponse.json({ message: "user not found" }, { status: 404 });

  const chats = await Chat.find({ user_id: user._id })
    .populate({ path: "boardgame_id", select: "title thumbnail is_expansion slug" })
    .sort({ last_message_at: -1 })
    .lean();

  const filteredChats = chats.filter((c) => c.boardgame_id && !c.boardgame_id.is_expansion);

  const chatIds = filteredChats.map((c) => c._id);
  const lastMessages = await Message.find({ chat_id: { $in: chatIds }, role: "assistant" })
    .sort({ createdAt: -1 })
    .lean();

  const lastMsgMap = {};
  for (const msg of lastMessages) {
    const key = msg.chat_id.toString();
    if (!lastMsgMap[key]) lastMsgMap[key] = msg;
  }

  const enriched = filteredChats.map((chat) => {
    const msg = lastMsgMap[chat._id.toString()];
    return {
      ...chat,
      last_message: msg?.content ?? chat.last_message ?? "",
      last_message_at: msg?.createdAt ?? chat.last_message_at,
    };
  });

  return NextResponse.json({ data: enriched, message: "success" }, { status: 200 });
}
