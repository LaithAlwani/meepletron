import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  const { messages } = await req.json();
  
  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      
      messages,
     
    });

    return result.toDataStreamResponse();
  } catch (err) {
    return err;
  }
}
