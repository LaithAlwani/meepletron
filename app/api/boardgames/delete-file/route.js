import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import Boardgame from "@/models/boardgame";
import Expansion from "@/models/expansion";
import connectToDB from "@/utils/database";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
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

  const { boardgame, filePath } = await req.json();
  if (!boardgame || !filePath) {
    return NextResponse.json({ message: "Missing boardgame or filePath" }, { status: 400 });
  }

  try {
    // Delete vectors from Pinecone scoped to this specific file
    const pinecone = new PineconeClient();
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
    const results = await pineconeIndex.query({
      vector: Array(3072).fill(0),
      topK: 1000,
      includeMetadata: false,
      filter: { bg_id: boardgame._id.toString(), bg_refrence_url: filePath },
    });
    if (results.matches.length > 0) {
      await pineconeIndex.deleteMany(results.matches.map((m) => m.id));
    }

    // Delete file from S3
    const key = filePath.split("amazonaws.com/").pop();
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key })
    );

    // Remove URL entry from MongoDB
    await connectToDB();
    const Model = boardgame.parent_id ? Expansion : Boardgame;
    const doc = await Model.findByIdAndUpdate(
      boardgame._id,
      { $pull: { urls: { path: filePath } } },
      { new: true }
    );
    if (!doc) return NextResponse.json({ message: "Boardgame not found" }, { status: 404 });

    return NextResponse.json({ data: doc, message: "File deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Failed to delete file" }, { status: 500 });
  }
}
