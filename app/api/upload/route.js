import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");
  const boardgame = {
    title: data.get("title"),
    thumbnail: data.get("thumbnail"),
    image: data.get("image"),
    isExpansion: data.get("isExpansion"),
    year: data.get("year"),
    minPlayers: data.get("minPlayers"),
    maxPlayers: data.get("maxPlayers"),
    playTime: data.get("playTime"),
    bggLink: data.get("bggLink"),
    bggId: data.get("bggId"),
    description: data.get("description"),
  };
  if (!file) {
    return NextResponse.json({ success: false });
  }
  try {
    await connectToDB();
    const chunks = await getChunkedDocsFromPDF(file);
    
    if (!chunks.length) {
      return NextResponse.json({ message: "Failed" }, { status: 500 })
    }
    const doc = await Boardgame.create(boardgame);
    
    for (const chunk in chunks) {
      chunks[chunk].metadata.bg_id = doc._id.toString();
      chunks[chunk].metadata.bg_title = doc.title.toLowerCase();
    }

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large",
    });

    const pinecone = new PineconeClient();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });
    await vectorStore.addDocuments(chunks);

    return NextResponse.json({ data: chunks, message: "Data Embedded" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to upload" }, { status: 500 });
  }
}
