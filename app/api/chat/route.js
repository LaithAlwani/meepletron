import { queryPineconeVectorStore } from "@/lib/vector-store";
import Boardgame from "@/models/boardgame"; //used for populating chat list with boardgame details, not used in the POST route
import Chat from "@/models/chat";
import Message from "@/models/message";
import User from "@/models/user";
import connectToDB from "@/utils/database";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { createDataStreamResponse, streamText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const pinecone = new PineconeClient();
const google = createGoogleGenerativeAI();
const DAILY_TOKEN_LIMIT = 50_000;


export async function POST(req) {
  const { messages, boardgame_id, boardgame_title } = await req.json();
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

  const userQuestion = messages[messages.length - 1].content.trim();
  
  const retrievals = await queryPineconeVectorStore(
    pinecone,
    process.env.PINECONE_INDEX_NAME,
    userQuestion,
    boardgame_id
  );

  if (!Array.isArray(retrievals) || retrievals.length === 0) {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        const result = streamText({
          model: google("gemini-2.5-flash"),
          system: `You are a friendly board game assistant. The rulebook for "${boardgame_title}" has not been uploaded yet, so you have no information to draw from. In one or two sentences, let the user know that no rulebook has been added for this game yet, so you can't answer their questions right now. Suggest they check back later or let an admin know.`,
          messages,
          temperature: 0,
        });
        result.mergeIntoDataStream(dataStream);
      },
      onError: (error) => (error instanceof Error ? error.message : String(error)),
    });
  }

  const formattedContext = retrievals.map((item) => item.text).join("\n\n");

  const system = `You are a board game rules assistant for ${boardgame_title}.

Your ONLY source of truth is the Context section below — the extracted rulebook text. You must not use any general board game knowledge, prior training, or assumptions.

Follow these rules exactly:

- ANSWER FOUND: If the Context clearly contains the answer, respond directly and completely. Cover every step of a process, every branch of an outcome, and every condition — do not stop at the first bullet. Include all numbers, card counts, point values, and table data. Use a numbered list for sequential steps, bullet points for parallel outcomes or options, and plain prose only for a single indivisible fact. No filler phrases ("Great question!", "Certainly!", "Based on the rulebook…").

- VAGUE QUESTION: If the question is too broad to answer precisely from the Context (e.g. "how do I play?", "what are all the rules?", "explain the game"), do not guess. Instead respond: "That's a broad question — try asking something more specific, like:" followed by 2–3 example questions drawn from topics visible in the Context.

- NOT IN CONTEXT: If the specific answer is not present in the Context, respond: "I couldn't find that in the rulebook." Then suggest 1–2 related topics from the Context the user could ask about instead.

Never mention page numbers, sources, or tell the user to consult the rulebook.

Context:
${formattedContext}`;

  try {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.writeData("initialized call");

        const result = streamText({
          model: google("gemini-2.5-flash"),
          system,
          messages,
          temperature: 0,
          topK: 3,
          frequencyPenalty: 0,
          presencePenalty: 0,
          maxRetries: 3,
          onFinish({ usage }) {
            const top = retrievals[0];
            if (top?.pageNumber) {
              dataStream.writeMessageAnnotation({
                pageNumber: top.pageNumber,
                url: `${top.source}#page=${top.pageNumber}`,
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
    // const result = await streamText({
    //   model: google("gemini-2.0-flash"),
    //   prompt: prompt,
    //   temperature: 0,
    //   topK: 3,
    //   frequencyPenalty: 0,
    //   presencePenalty: 0,
    //   maxRetries: 3,
    //   maxTokens: 256,
    //   // experimental_output: Output.object({
    //   //   schema: z.array(
    //   //     z.object({
    //   //       pageNumber: z.number().describe("the page number"),
    //   //       text: z.string().describe("a text chunk that answers the user input"),
    //   //       source: z.string().describe("a url for the pdf file that the text was retrieved from"),
    //   //     })
    //   //   ),
    //   // }),
    // });

    // return result.toDataStreamResponse();
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
    .populate({ path: "boardgame_id", select: "title thumbnail is_expansion" })
    .sort({ last_message_at: -1 })
    .lean();

  const filteredChats = chats.filter((c) => c.boardgame_id && !c.boardgame_id.is_expansion);

  // Batch-fetch the last assistant message for every chat in one query
  const chatIds = filteredChats.map((c) => c._id);
  const lastMessages = await Message.find({ chat_id: { $in: chatIds }, role: "assistant" })
    .sort({ createdAt: -1 })
    .lean();

  // Keep only the first (newest) result per chat
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
