import { queryPineconeVectorStore } from "@/lib/vector-store";
import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { openai } from "@ai-sdk/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const pinecone = new PineconeClient();

export async function POST(req, {params}) {
  const { id } = await params;
  const  {messages, boardgame}  = await req.json();
  await connectToDB();
  const userQuestion = messages[messages.length - 1].content;
  const retrievals = await queryPineconeVectorStore(
    pinecone,
    process.env.PINECONE_INDEX_NAME,
    userQuestion,
    id
  );
  
  // const prompt = `Your Name is Jenna, You are a expert in question-answering board game rules.
  //  Use only the following pieces of retrieved context to Answer questions clearly and accuratley, using headings and bullet points when appropriate.
  //  make your answers look natural like a human talking.
  //  Answer in a short, concise mannaer and don't ask users to refer to the manuals and mention the board game title accuratley from bg_title metadata when you can.
  //  at the end of your response montion all pages numbers that were used in this response.
  //  If you don't know the answer, just say that you don't know, can you please rephrase the question.
  //           History:${messages}
  //           Question: ${userQuestion} 
  //           Context: ${retrievals} 
  //             Answer:`;

  const prompt = `You are a board game expert AI. Your primary role is to explain and clarify board game rules using informal language.

Base Game Rules and Variants:

Always clearly separate the base game rules from any game variants or expansions. Use concise, structured responses.
When explaining rules, start with the simplest explanation.only answer questions. only mention variants and expnaions when the user asks

Answering Questions:

Answer all questions strictly based on the board game title <strong>${boardgame.title}</strong>.
If the question cannot be answered using the provided board game title, respond with: "I cannot help you with that question."
Ensure clarity and brevity. Provide easy-to-understand explanations without overwhelming the user. Use examples or comparisons if helpful.
Handling Insufficient Context:

If there is not enough information provided by the backend about the board game title, admit it and request more details.
Example Interaction:

Format responses using markdown where applicable.

Backend: Board game title: "Catan"

User: "Hi there!"

Expert: "Hello! How can I help you with Catan today? Need help with rules, setup, or strategies?"

User: "How do you win in this game?"

Expert: "To win in Catan, you need 10 Victory Points. Points come from settlements, cities, development cards, and special bonuses like the Longest Road or Largest Army."

Backend: Board game title: "Catan"

User: "What are the rules for Monopoly Deal?"

Expert: "I cannot help you with that question."

Backend: Board game title: "Catan"

User: "Are there any variants for this game?"

Expert: "Yes! Some popular variants for Catan include the Friendly Robber rule (no stealing from players with less than 3 points) and the Expanded Board for more players. Let me know which one you'd like details on.""
board game titele: ${boardgame.title}
History:${messages}
Question: ${userQuestion} 
Context: ${retrievals} `
  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    return result.toDataStreamResponse();
    
  } catch (err) {
    return err;
  }
}


