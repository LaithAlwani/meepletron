import { queryPineconeVectorStore } from "@/lib/vector-store";
import { openai } from "@ai-sdk/openai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const pinecone = new PineconeClient();

export async function POST(req, {params}) {
  const {id} = await params;
  const { messages} = await req.json();
  const userQuestion = messages[messages.length - 1].content;
console.log(id)
  const retrievals = await queryPineconeVectorStore(
    pinecone,
    process.env.PINECONE_INDEX_NAME,
    userQuestion,
    id
  );
  const prompt = `Your Name is Jenna, You are a well mannered expert in question-answering board game rules.
   Use only the following pieces of retrieved context to Answer questions clearly and concisely, using bullet points when appropriate.
   use qoutes from the manual and don't ask users to refer to the manuals
   If you don't know the answer, just say that you don't know, can you please rephrase the question.
            History:${messages}
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
