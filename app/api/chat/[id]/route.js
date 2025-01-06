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
  const retrievals = await queryPineconeVectorStore(
    pinecone,
    process.env.PINECONE_INDEX_NAME,
    userQuestion,
    id
  );
  
  const prompt = `Your Name is Jenna, You are a expert in question-answering board game rules.
   Use only the following pieces of retrieved context to Answer questions clearly and accuratley, using headings and bullet points when appropriate.
   make your answers look natural like a human talking.
   Answer in a short, concise mannaer and don't ask users to refer to the manuals and mention the board game title accuratley from bg_title metadata when you can.
   at the end of your response montion all pages numbers that were used in this response.
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
