import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");
  if (!file) {
    return NextResponse.json({ success: false });
  }
  try {
    
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
  catch (err) {
    console.log(err)
    return NextResponse.json({message:"Failed to upload"}, {status:500})
  }
  
}
