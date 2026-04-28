import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import he from "he";
import Expansion from "@/models/expansion";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
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

  const { boardgame, chunks, tempFileUrl } = await req.json();
  await connectToDB();

  boardgame.description = cleanText(boardgame.description);

  const safeTitle = boardgame.title.replace(/\s+/g, "-").toLowerCase();
  const isExpansion = boardgame.parent_id !== "null";

  // Pre-check: does game already exist?
  if (!isExpansion) {
    const boardgameExist = await Boardgame.findOne({ bgg_id: boardgame.bgg_id });
    if (boardgameExist)
      return NextResponse.json({ data: `${boardgame.title} already exists` }, { status: 400 });
  } else {
    const expExist = await Expansion.findOne({ bgg_id: boardgame.bgg_id });
    if (expExist)
      return NextResponse.json({ data: `${boardgame.title} already exists` }, { status: 400 });
  }

  let game = null;
  let parentBoardgame = null;
  let permanentKey = null;
  let pineconeStored = false;

  try {
    // 1. Upload image to S3
    const { orginalURL, thumbnailURL } = await covertAndUpload(safeTitle, boardgame.image);
    boardgame.image = orginalURL;
    boardgame.thumbnail = thumbnailURL;

    // 2. Create game in MongoDB
    if (!isExpansion) {
      game = await Boardgame.create(boardgame);
    } else {
      parentBoardgame = await Boardgame.findOne({ bgg_id: boardgame.parent_id });
      if (!parentBoardgame)
        return NextResponse.json({ error: "Parent boardgame not found" }, { status: 404 });

      game = await Expansion.create({ ...boardgame, parent_id: parentBoardgame._id });
      await Boardgame.findByIdAndUpdate(parentBoardgame._id, {
        $push: { expansions: game._id },
      });
    }

    // 3. Handle rulebook file + embeddings
    if (chunks?.length && tempFileUrl) {
      const ext = tempFileUrl.split(".").pop();
      permanentKey =
        process.env.NODE_ENV !== "production"
          ? `_temp_boardgames/resources/${safeTitle}-rulebook.${ext}`
          : `resources/${safeTitle}-rulebook.${ext}`;

      const tempKey = tempFileUrl.split("amazonaws.com/").pop();

      // Copy from temp S3 path to permanent path
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          CopySource: `${process.env.AWS_BUCKET_NAME}/${tempKey}`,
          Key: permanentKey,
        })
      );
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: tempKey,
        })
      );

      const permanentUrl = `https://meepletron-storage.s3.us-east-2.amazonaws.com/${permanentKey}`;

      // Enrich chunks with game metadata
      for (const chunk of chunks) {
        chunk.metadata.bg_id = game._id.toString();
        chunk.metadata.parent_id = isExpansion
          ? parentBoardgame._id.toString()
          : game._id.toString();
        chunk.metadata.bg_title = boardgame.title.toLowerCase();
        chunk.metadata.bg_refrence_url = permanentUrl;
      }

      // Create embeddings and store in Pinecone
      const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
      const pinecone = new PineconeClient();
      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
      const vectorStore = new PineconeStore(embeddings, { pineconeIndex, maxConcurrency: 5 });
      await vectorStore.addDocuments(chunks);
      pineconeStored = true;

      // Update game document with file URL
      const Model = isExpansion ? Expansion : Boardgame;
      await Model.findByIdAndUpdate(game._id, {
        $push: { urls: { path: permanentUrl, isTextExtracted: true } },
      });
    }

    return NextResponse.json({ data: boardgame.title }, { status: 201 });
  } catch (err) {
    console.log(err);

    // Rollback in reverse order of what succeeded
    if (pineconeStored && game) {
      try {
        const pinecone = new PineconeClient();
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
        const results = await pineconeIndex.query({
          vector: Array(3072).fill(0),
          topK: 1000,
          includeMetadata: false,
          filter: { bg_id: game._id.toString() },
        });
        if (results.matches.length) {
          await pineconeIndex.deleteMany(results.matches.map((m) => m.id));
        }
      } catch {}
    }

    if (permanentKey) {
      await s3Client
        .send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: permanentKey }))
        .catch(() => {});
    }

    if (game) {
      if (isExpansion && parentBoardgame) {
        await Boardgame.findByIdAndUpdate(parentBoardgame._id, {
          $pull: { expansions: game._id },
        }).catch(() => {});
      }
      const Model = isExpansion ? Expansion : Boardgame;
      await Model.findByIdAndDelete(game._id).catch(() => {});
    }

    // Always clean up temp file
    if (tempFileUrl) {
      const tempKey = tempFileUrl.split("amazonaws.com/").pop();
      await s3Client
        .send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: tempKey }))
        .catch(() => {});
    }

    return NextResponse.json({ data: err.message }, { status: 500 });
  }
}

const covertAndUpload = async (safeTitle, url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Failed to fetch image`);

  const originalBuffer = await response.arrayBuffer();
  const webpBuffer = await sharp(Buffer.from(originalBuffer))
    .resize({ width: 1080, height: 1080, fit: "inside" })
    .toFormat("webp", { quality: 75, effort: 6, lossless: false })
    .toBuffer();

  const thumbnailBuffer = await sharp(originalBuffer)
    .resize({ width: 320, height: 320, fit: "inside" })
    .toFormat("webp", { effort: 6, lossless: false })
    .toBuffer();

  const imagePathDEV = `_temp_boardgames/images/${safeTitle}-board-game.webp`;
  const imagePathPROD = `images/${safeTitle}-board-game.webp`;
  const thumbnailPathDEV = `_temp_boardgames/thumbnails/${safeTitle}-board-game.webp`;
  const thumbnailPathPROD = `thumbnails/${safeTitle}-board-game.webp`;

  const imagePath = process.env.NODE_ENV !== "production" ? imagePathDEV : imagePathPROD;
  const thumbnailPath =
    process.env.NODE_ENV !== "production" ? thumbnailPathDEV : thumbnailPathPROD;

  const imageParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imagePath,
    Body: webpBuffer,
    ContentType: "image/webp",
  };
  const thumbnailParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: thumbnailPath,
    Body: thumbnailBuffer,
    ContentType: "image/webp",
  };

  await s3Client.send(new PutObjectCommand(imageParams));
  await s3Client.send(new PutObjectCommand(thumbnailParams));

  const orginalURL = `https://meepletron-storage.s3.us-east-2.amazonaws.com/${imagePath}`;
  const thumbnailURL = `https://meepletron-storage.s3.us-east-2.amazonaws.com/${thumbnailPath}`;
  return { orginalURL, thumbnailURL };
};

function cleanText(input) {
  if (!input) return "";
  let decoded = he.decode(input);
  return decoded
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}
