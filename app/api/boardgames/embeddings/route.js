import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";

export async function POST(req) {
  const data = await req.json();
  const { fileText, boardgame, blob } = data;
  if (!fileText || !boardgame) {
    return NextResponse.json({ data: "no text or boardgame found!" });
  }
  try {
    await connectToDB();
    if (!fileText.length) {
      return NextResponse.json({ data: "File has no text" }, { status: 500 });
    }

    const doc = await Boardgame.findOneAndUpdate(
      { _id: boardgame._id, "urls.path": blob.path }, // Find the board game and specific URL entry
      { $set: { "urls.$.isTextExtracted": true } }, // Update the matched element
      { new: true } // Return the updated document
    );

    if (!doc) return NextResponse.json({ data: "Boardgame not found" }, { status: 500 });
    for (const chunk in fileText) {
      fileText[chunk].metadata.bg_id = boardgame._id.toString();
      fileText[chunk].metadata.parent_id = boardgame.is_expansion
        ? boardgame.parent_id?.toString()
        : boardgame._id.toString();
      fileText[chunk].metadata.bg_title = boardgame.title.toLowerCase();
      fileText[chunk].metadata.bg_refrence_url = blob.path;
    }
    const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
    // const embeddings = new OpenAIEmbeddings({model: "text-embedding-3-large"});

    const pinecone = new PineconeClient();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    const vectorStore = new PineconeStore(embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });
    await vectorStore.addDocuments(fileText);
    return NextResponse.json(
      { data: doc, message: `${boardgame.title} Data Embedded` },
      { status: 200 }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to Embed data" }, { status: 500 });
  }
}
