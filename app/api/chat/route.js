import { queryPineconeVectorStore } from "@/lib/vector-store";
import Chat from "@/models/chat";
import User from "@/models/user";
import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { streamText } from "ai";
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

  const prompt = `You are a board game expert AI. Your primary role is to explain and clarify board game rules using informal, human-like language.  

**Rules and Variants:**  
- Focus on explaining base game rules in a simple and clear way.  
- Mention variants or expansions only if the user specifically asks about them.  
- You may use bullet points if they help clarify or organize the response, but avoid headings.  

**Answering Questions:**  
- Respond conversationally, as if you are a human expert. 
- Base all answers strictly on the context provided by the backend. If you cannot answer the question using the context, respond with: "I cannot help you with that question."  
- Avoid giving opinions about the rules, such as whether they are good, harsh, or horrible.
- at the end of the response provide the page number that was used to get this information.
- use quotes from the cotext if possible


**Handling Insufficient Context:**  
- If there isn’t enough information about the game in the context provided, let the user know and ask for more details.

**Style:**  
- Use informal language that feels natural and conversational.  


Example Interaction:  

_Backend: Board game title: "Catan"_  

_User: "Hi there!"_  
"Hey! How can I help you today? Need clarification on rules or strategies?"  

_User: "How do you win in this game?"_  
"You win by collecting 10 points. You earn points from building settlements, cities, or through bonuses like the longest road or largest army."  

_Backend: Board game title: "Catan"_  
_User: "What are the rules for Monopoly Deal?"_  
"I cannot help you with that question."  

_Backend: Board game title: "Catan"_  
_User: "Are there any variants for this game?"_  
"There are a few. One popular option is the Friendly Robber rule where you don’t steal from players with less than three points."  

---

**Board game title:** ${boardgame_title}  
**History:** ${messages}  
**Question:** ${userQuestion}  
**Context:** ${retrievals}`;

  const google = createGoogleGenerativeAI();

  try {
    const result = await streamText({
      model: google("gemini-1.5-flash-8b"),
      prompt,
      temperature: 0,
      topK: 5,
    });

    return result.toDataStreamResponse();
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
  if(!user) return NextResponse.json({message:"user not found"},{status:404})
  const chats = await Chat.find({ user_id: user?._id })
    .populate({ path: "boardgame_id", select: "title thumbnail is_expansion" })
    .sort({ updatedAt: -1 })
    .lean();
  const filteredChats = chats.filter((chat) => {
    return chat.boardgame_id && !chat.boardgame_id.is_expansion;
  });
  return NextResponse.json({ data: filteredChats, message: "success" }, { status: 200 });
}
