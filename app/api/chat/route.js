import { queryPineconeVectorStore } from "@/lib/vector-store";
import Chat from "@/models/chat";
import User from "@/models/user";
import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { createDataStreamResponse, streamText } from "ai";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const pinecone = new PineconeClient();

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
  

  const formattedContext = retrievals
    .map((item) => `${item.text} (Page ${item.pageNumber}) [Source](${item.source})`)
    .join("\n\n");

  const system = `You are a board game expert AI. Your primary role is to explain and clarify board game rules in [Game Title], your response should maintain a natural, human-like tone. 
Avoid using verbose words, flowery words, fluffy, words, exaggerated terms, unneccessary and/or superlative adjectives or qualifiers
(e.g, comprehensive, robust, extensive).  

**Rules and Variants:**  
- Focus on explaining base game rules in a simple and clear way.  
- Mention variants only if the user specifically asks about them.  
- You may use bullet points if they help clarify or organize the response.

**Answering Questions:**  
- Base all answers strictly on the [Context] provided. 
- ensure the use of quotes from the cotext
- Reference the page number at the end of the answer formatted like this: "[Page X]" where "X" is the page number.


**Handling Insufficient Context:**
- If the answer is not found in the provided context, explicitly state that rather than speculating, and ask the user to use in-game terms when asking questions

Example Interaction:  

_Backend: Board game title: "Catan"_  

_User: "Hi there!"_  
"Hey! How can I help you today? Need clarification on rules or strategies?"  

_User: "How do you win in this game?"_  
"You win by collecting 10 points. You earn points from building settlements, cities, or through bonuses like the longest road or largest army."  

_Backend: Board game title: "Catan"_  
_User: "What are the rules for Monopoly Deal?"_  
"I cannot help you with that question."  

---

**Game Title:** ${boardgame_title}  
**Question:** ${userQuestion}  
**Context:** ${formattedContext}`;

  const google = createGoogleGenerativeAI();

  try {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.writeData("initialized call");

        const result = streamText({
          model: google("gemini-2.0-flash"),
          system,
          messages,
          temperature: 0,
          topK: 3,
          frequencyPenalty: 0,
          presencePenalty: 0,
          maxRetries: 3,
          onFinish() {
            // message annotation:
            dataStream.writeMessageAnnotation({
              pageNumber: retrievals[0].pageNumber,
              url: `${retrievals[0].source}#page=${retrievals[0].pageNumber}`,
            });

            // call annotation:
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
  const searchParams = new URLSearchParams(url.searchParams);
  const user_id = searchParams.get("user_id");

  await connectToDB();
  const user = await User.findOne({ clerk_id: user_id });
  if (!user) return NextResponse.json({ message: "user not found" }, { status: 404 });
  const chats = await Chat.find({ user_id: user?._id })
    .populate({ path: "boardgame_id", select: "title thumbnail is_expansion" })
    .sort({ updatedAt: -1 })
    .lean();
  const filteredChats = chats.filter((chat) => {
    return chat.boardgame_id && !chat.boardgame_id.is_expansion;
  });
  return NextResponse.json({ data: filteredChats, message: "success" }, { status: 200 });
}
