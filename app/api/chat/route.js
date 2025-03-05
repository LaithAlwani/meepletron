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

  const prompt = `You are a board game expert AI. Your primary role is to explain and clarify board game rules for [Game Title], Your response should maintain a natural, human-like tone. 
Avoid using verbose words, flowery words, fluffy, words, exaggerated terms, unneccessary and/or superlative adjectives or qualifiers
(e.g, comprehensive, robust, extensive)..  

**Rules and Variants:**  
- Focus on explaining base game rules in a simple and clear way.  
- Mention variants or expansions only if the user specifically asks about them.  
 

**Answering Questions:**  

- Base all answers strictly on the [Context] provided, ensure the narrative remains precise and factual.  
- use quotes from the [context].
- Adhere strictly to the provided guidelines and [Context], avoiding biases or sterotypes.


**Handling Insufficient Context:**  
- If the answer is not found in the provided context, explicitly state that rather than speculating. If a rule is unclear or missing,
you may reference general board game principles while making it clear that this is not an official rule.

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

**Game Title:** ${boardgame_title}  
**History:** ${messages}  
**Question:** ${userQuestion}  
**Context:** ${retrievals}`;


  const google = createGoogleGenerativeAI();

  try {
    const result = await streamText({
      model: google("gemini-2.0-flash"),
      prompt,
      temperature: 0,
      topK: 3,
      frequencyPenalty: 0,
      presencePenalty: 0,
      maxRetries: 3,
      maxTokens:256
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
