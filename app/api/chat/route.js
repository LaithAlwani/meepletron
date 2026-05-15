import { retrieveForChat, rerankChunks } from "@/lib/vector-store";
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
const RERANK_TOP_N = 3;

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

  const overrideRule = multiSource
    ? `

- MULTIPLE SOURCES: The user has loaded ${sources.length} sources: ${sourceList}. When sources cover the same topic, present the base game's rule first, then call out the override explicitly: "In <Expansion name>, this changes: <rule>." Never silently mix sources. Variants apply only when chosen — always label variant rules as "Variant: <name>" before stating them.`
    : "";

  const legendSection = legendBlock
    ? `

Iconography (always available — use these to interpret bracketed tokens like [WOOD] or [VP] in the rulebook text):

${legendBlock}`
    : "";

  const unloadedSection = unloadedTitles?.length
    ? `

UNLOADED SOURCES (these exist for this game but the user has explicitly NOT loaded them — you have ZERO information about them, do not paraphrase what you remember from training): ${unloadedTitles.join(", ")}.
If the user asks about any of these by name, respond verbatim: "That source isn't loaded in this chat. Open the side panel and check the box for <name> to enable it." Then stop. Do not add tips, summaries, or 'in general' framing.`
    : "";

  return `You are a board game rules assistant.

ACTIVE SOURCES (the ONLY rulebooks loaded in this conversation): ${sourceList}.${unloadedSection}

CONTEXT-ONLY RULE — read this twice:
Your ONLY source of truth is the Context section at the bottom of this prompt. You must not use any general board game knowledge, prior training, or assumptions about games, expansions, or variants. If a fact is not in the Context, you do not know it. Period. This applies even when the user asks a confident, leading question that implies you should know the answer.

Follow these rules exactly:

- STRICT CITATION: Every factual rule statement MUST be backed by a source from the Context that LITERALLY contains that fact. Append the matching source number in square brackets: "Players draw 5 cards [2]." Cite multiple sources when relevant: "[1][3]". Never cite a source for a fact it doesn't contain. Never use a citation as decoration to make a training-derived statement look grounded. If you can't find a citation, you don't have the fact — fall back to "I couldn't find that in the rulebook."

- don't skip any details. If the Context contains relevant information, include it in your answer, even if it seems minor or obvious.

- ANSWER FOUND: If the Context clearly contains the answer, respond directly and completely. Cover every step of a process, every branch of an outcome, and every condition — do not stop at the first bullet. Include all numbers, card counts, point values, and table data. Use a numbered list for sequential steps, bullet points for parallel outcomes or options, and plain prose only for a single indivisible fact. No filler phrases ("Great question!", "Certainly!", "Based on the rulebook…").

- VAGUE QUESTION: If the question is too broad to answer precisely from the Context (e.g. "how do I play?", "what are all the rules?", "explain the game"), do not guess. Instead respond: "That's a broad question — try asking something more specific, like:" followed by 2–3 example questions drawn from topics visible in the Context.

- NOT IN CONTEXT: If the specific answer is not present in the Context, respond: "I couldn't find that in the rulebook." Then suggest 1–2 related topics from the Context the user could ask about instead.

- ICON TOKENS: Rulebook text may use bracketed tokens like [WOOD], [VP], [ATTACK] to represent game icons; their meaning is defined in the Iconography section above. NEVER show these bracket tokens in your reply — ALWAYS replace each one with its plain-English name from the Iconography section. Write "discard a wood card," not "discard a [WOOD]." Write "score 3 victory points," not "score 3 [VP]." If an icon appears in the Context without a definition in the Iconography section, describe it in plain words (e.g. "the resource icon shown") rather than echoing the bracketed token. Numeric citation markers like [1], [2], [3] are different — those are required and must stay.

Never tell the user to consult the rulebook or any external resource.${overrideRule}${legendSection}

Context:
${contextBlock}

FINAL REMINDER: Answer ONLY from the Context above. If the answer is not literally in the Context, say "I couldn't find that in the rulebook." Do not fall back to your training data about board games. Do not cite a source for a fact that source doesn't contain.`;
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

  // Retrieve: vector search (v1 and/or v2 depending on each source's pipeline)
  // + always-on legend chunks for v2 sources.
  const { chunks: retrieved, legendChunks } = await retrieveForChat({
    client: pinecone,
    query: userQuestion,
    boardgames: sources,
  });

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
  const rerankedChunks =
    retrieved.length > RERANK_TOP_N
      ? await rerankChunks(userQuestion, retrieved, RERANK_TOP_N)
      : retrieved;

  const legendBlock = formatLegendBlock(legendChunks);
  const contextBlock = formatSourceContext(rerankedChunks, sources);
  // Defensive: ensure we only pass strings, and never list a title that's
  // also one of the active sources (e.g. if the frontend sent stale data).
  const activeTitles = new Set(sources.map((s) => s.title));
  const unloadedTitles = Array.isArray(unloaded_source_titles)
    ? unloaded_source_titles.filter((t) => typeof t === "string" && t && !activeTitles.has(t))
    : [];
  const system = buildSystemPrompt({ sources, unloadedTitles, legendBlock, contextBlock });

  try {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.writeData("initialized call");

        const result = streamText({
          model: google("gemini-2.5-flash"),
          system,
          messages,
          temperature: 0,
          frequencyPenalty: 0,
          presencePenalty: 0,
          maxRetries: 3,
          experimental_transform: smoothStream({
            delayInMs: 25,
            chunking: "word",
          }),
          onFinish({ usage }) {
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
