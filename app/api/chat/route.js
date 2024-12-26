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

  const retrievals = await queryPineconeVectorStore(pinecone, "test-index", userQuestion);
  console.log(retrievals);
  const prompt = `Go through the use query, find relvent informaion about
  the board game in question.
  Ensure the reponse is factully accurate and demonstrates a thorough understading
  of the query topic and board game manual,"
  use ${retrievals} at answer the question keep it at 1-3 sentace long.
  if no relevant information is found in the tool calls, respond, "Sorry, I don't know.`
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
