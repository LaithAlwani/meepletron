import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");
  if (!file) {
    return NextResponse.json({ success: false });
  }
  const chunks = await getChunkedDocsFromPDF(file);
  console.log(chunks[0]);
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });
  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const vectorStore = new PineconeStore(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
  await vectorStore.addDocuments(chunks);

  return NextResponse.json({ message: "Data Embedded" }, { status: 200 });
  
}
