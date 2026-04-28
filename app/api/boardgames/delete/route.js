import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import Chat from "@/models/chat";
import Message from "@/models/message";
import connectToDB from "@/utils/database";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { boardgame } = await req.json();
  if (!boardgame) {
    return NextResponse.json({ message: "Please provide a boardgame" }, { status: 400 });
  }

  try {
    await connectToDB();

    const game = await Boardgame.findById(boardgame._id).lean();
    if (!game) return NextResponse.json({ message: "Boardgame not found" }, { status: 404 });

    const expansions = await Expansion.find({ parent_id: game._id }).lean();

    // Delete Pinecone vectors for the game and all its expansions
    const allGameIds = [game._id.toString(), ...expansions.map((e) => e._id.toString())];
    await deletePineconeVectors(allGameIds);

    // Collect all S3 keys: rulebook files + images + thumbnails
    const s3Keys = [];
    const collectS3Keys = (doc) => {
      doc.urls?.forEach(({ path }) => {
        if (path) s3Keys.push(path.split("amazonaws.com/").pop());
      });
      if (doc.thumbnail) s3Keys.push(doc.thumbnail.split("amazonaws.com/").pop());
      if (doc.image) s3Keys.push(doc.image.split("amazonaws.com/").pop());
    };
    collectS3Keys(game);
    expansions.forEach(collectS3Keys);

    if (s3Keys.length) await deleteS3Objects(s3Keys);

    // Delete chats + messages for the game and all its expansions
    const allBoardgameIds = [game._id, ...expansions.map((e) => e._id)];
    const chatIds = await Chat.find({ boardgame_id: { $in: allBoardgameIds } }).distinct("_id");
    if (chatIds.length) {
      await Message.deleteMany({ chat_id: { $in: chatIds } });
      await Chat.deleteMany({ _id: { $in: chatIds } });
    }

    // Delete expansions and the game itself
    await Expansion.deleteMany({ parent_id: game._id });
    await Boardgame.findByIdAndDelete(game._id);

    return NextResponse.json({ message: `${game.title} deleted successfully` }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to delete boardgame" }, { status: 500 });
  }
}

const deletePineconeVectors = async (ids) => {
  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

  await Promise.all(
    ids.map(async (id) => {
      const results = await pineconeIndex.query({
        vector: Array(3072).fill(0),
        topK: 1000,
        includeMetadata: false,
        filter: { bg_id: id },
      });
      if (results.matches.length > 0) {
        await pineconeIndex.deleteMany(results.matches.map((m) => m.id));
      }
    })
  );
};

const deleteS3Objects = async (keys) => {
  try {
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: { Objects: keys.map((k) => ({ Key: k })) },
      })
    );
  } catch (err) {
    console.error("S3 deletion error:", err.message);
  }
};
