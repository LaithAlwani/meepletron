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

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const pinecone = new PineconeClient();
const google = createGoogleGenerativeAI();


export async function POST(req) {
  const { messages, boardgame_id, boardgame_title } = await req.json();
  await connectToDB();
  const userQuestion = messages[messages.length - 1].content;
  
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

- Always give the complete answer — never omit numbers, card counts, point values, player limits, or any table data. If the question is about quantities or a breakdown, list every value.
- Use as few words as possible while keeping the answer complete. Cut filler prose, not facts.
- Use bullet points or a compact list when presenting multiple values or steps. Use plain prose for single-fact answers.
- When the information includes a table (e.g. points per card, cards per player count), reproduce it as a compact list.
- No filler: no "Great question!", no "Certainly!", no "Based on the rulebook…".
- Never mention page numbers or sources.
- Never tell the user to consult the rulebook, the manual, or any external resource. Always extract and present the relevant data directly from the context.

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
          onFinish() {
            const top = retrievals[0];
            if (top?.pageNumber) {
              dataStream.writeMessageAnnotation({
                pageNumber: top.pageNumber,
                url: `${top.source}#page=${top.pageNumber}`,
              });
            }
            dataStream.writeData("call completed");
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
