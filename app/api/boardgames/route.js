import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";

export async function POST(req) {
  const data = await req.json();
  const { fileText, boardgame, parent_id } = data;
  if (!fileText || !boardgame) {
    return NextResponse.json({ success: false });
  }
  try {
    await connectToDB();
    if (!fileText.length) {
      return NextResponse.json({ message: "Failed to chunk file" }, { status: 500 });
    }
    let doc;
    if (parent_id) {
      doc = await Expansion.create({ ...boardgame, parent_id });
    } else {
      doc = await Boardgame.create(boardgame);
    }

    for (const chunk in fileText) {
      fileText[chunk].metadata.bg_id = doc._id.toString();
      fileText[chunk].metadata.parent_id = !parent_id ? doc._id.toString() : parent_id;
      fileText[chunk].metadata.bg_title = doc.title.toLowerCase();
    }

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large",
    });

    const pinecone = new PineconeClient();
    const pineconeIndex = pinecone.Index(
      process.env.NODE_ENV != "production"
        ? process.env.PINECONE_INDEX_NAME_DEV
        : process.env.PINECONE_INDEX_NAME_PROD
    );
    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });
    await vectorStore.addDocuments(fileText);
    return NextResponse.json({ data: boardgame.title, message: "Data Embedded" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to upload" }, { status: 500 });
  }
}
