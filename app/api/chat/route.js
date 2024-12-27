import { queryPineconeVectorStore } from "@/lib/vector-store";
import { openai } from "@ai-sdk/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { streamText, tool } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const pinecone = new PineconeClient();

export async function POST(req) {
  const { messages } = await req.json();
  const userQuestion = messages[messages.length - 1].content;

  const retrievals = await queryPineconeVectorStore(
    pinecone,
    process.env.PINECONE_INDEX_NAME,
    userQuestion
  );
  const prompt = `You are an expert in question-answering simple greetings and board game rules.
   Use only the following pieces of retrieved context to answer the question accurately.
   If you don't know the answer, just say that you don't know.
            Question: ${userQuestion} 
            Context: ${retrievals} 
              Answer:`;

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
