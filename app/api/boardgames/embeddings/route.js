import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";

export async function POST(req) {
  const data = await req.json();
  const { fileText, boardgame, parent_id, blob } = data;
  if (!fileText || !boardgame) {
    return NextResponse.json({ data: "no text or boardgame found!" });
  }
  try {
    await connectToDB();
    if (!fileText.length) {
      return NextResponse.json({ data: "File has no text" }, { status: 500 });
    }
    let doc;
    doc = await Boardgame.findOneAndUpdate(
      { _id: boardgame._id, "urls.blob.pathname": blob.blob.pathname }, // Find the board game and specific URL entry
      { $set: { "urls.$.isTextExtracted": true } }, // Update the matched element
      { new: true } // Return the updated document
    );
    if (!doc)
      doc = await Expansion.findOneAndUpdate(
        { _id: boardgame._id, "urls.blob.pathname": blob.blob.pathname }, // Find the board game and specific URL entry
        { $set: { "urls.$.isTextExtracted": true } }, // Update the matched element
        { new: true } // Return the updated document
      );
    if (!doc) return NextResponse.json({ data: "Boardgame not found" }, { status: 500 });
    for (const chunk in fileText) {
      fileText[chunk].metadata.bg_id = boardgame._id.toString();
      fileText[chunk].metadata.parent_id = !parent_id ? boardgame._id.toString() : parent_id;
      fileText[chunk].metadata.bg_title = boardgame.title.toLowerCase();
      fileText[chunk].metadata.bg_refrence = blob.blob.contentDisposition.match(/filename="(.+?)\.pdf"/)[1];
      fileText[chunk].metadata.bg_refrence_url = blob.blob.url;
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
    await vectorStore.addDocuments(fileText);
    return NextResponse.json({ data: `${boardgame.title} Data Embedded` }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ data: "Failed to Embed data" }, { status: 500 });
  }
}
