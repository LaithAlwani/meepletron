import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import he from "he";
import Expansion from "@/models/expansion";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  const { boardgame } = await req.json();
  await connectToDB();
  console.log(boardgame);

  boardgame.description = cleanText(boardgame.description);
  const safeTitle = boardgame.title.replace(/\s+/g, "-").toLowerCase();
  const { orginalURL, thumbnailURL } = await covertAndUpload(safeTitle, boardgame.image);
  let doc;

  boardgame.image = orginalURL;
  boardgame.thumbnail = thumbnailURL;
  try {
    if (boardgame.parent_id == "null") {
      const boardgameExist = await Boardgame.findOne({ bgg_id: boardgame.bgg_id });
      if (boardgameExist)
        return NextResponse.json({ data: `${boardgame.title} already exists` }, { status: 400 });

      doc = await Boardgame.create(boardgame);
    } else {
      // 1️⃣ Find parent boardgame by BGG ID
      const parentBoardgame = await Boardgame.findOne({
        bgg_id: boardgame.parent_id, // parent BGG id
      });

      if (!parentBoardgame) {
        return NextResponse.json({ error: "Parent boardgame not found" }, { status: 404 });
      }

      // 2️⃣ Check expansion existence
      const expExist = await Expansion.findOne({
        bgg_id: boardgame.bgg_id,
      });

      if (expExist) {
        return NextResponse.json({ data: `${boardgame.title} already exists` }, { status: 400 });
      }

      // 3️⃣ CREATE expansion with FIXED parent_id
      const doc = await Expansion.create({
        ...boardgame,
        parent_id: parentBoardgame._id, // ✅ THIS IS THE KEY
      });

      // 4️⃣ Push expansion into parent boardgame
      await Boardgame.findByIdAndUpdate(parentBoardgame._id, {
        $push: { expansions: doc._id },
      });
    }

    return NextResponse.json({ data: boardgame.title }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ data: err.message }, { status: 500 });
  }
}

const covertAndUpload = async (safeTitle, url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);

  const originalBuffer = await response.arrayBuffer();
  const webpBuffer = await sharp(Buffer.from(originalBuffer))
    .resize({ width: 1080, height: 1080, fit: "inside" })
    .toFormat("webp", { quality: 75, effort: 6, lossless: false })
    .toBuffer();

  const thumbnailBuffer = await sharp(originalBuffer)
    .resize({ width: 320, height: 320, fit: "inside" }) // Keeps aspect ratio
    .toFormat("webp", { effort: 6, lossless: false })
    .toBuffer();

  const imagePathDEV = `_temp_boardgames/images/${safeTitle}-board-game.webp`;
  const imagePathPROD = `images/${safeTitle}-board-game.webp`;
  const thumbnailPathDEV = `_temp_boardgames/thumbnails/${safeTitle}-board-game.webp`;
  const thumbnailPathPROD = `thumbnails/${safeTitle}-board-game.webp`;

  const imagePath = process.env.NODE_ENV != "production" ? imagePathDEV : imagePathPROD;
  const thumbnailPath = process.env.NODE_ENV != "production" ? thumbnailPathDEV : thumbnailPathPROD;

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

  try {
    const imageCommand = new PutObjectCommand(imageParams);
    const thumbnailCommand = new PutObjectCommand(thumbnailParams);
    await s3Client.send(imageCommand);
    await s3Client.send(thumbnailCommand);

    const orginalURL = `https://meepletron-storage.s3.us-east-2.amazonaws.com/${imagePath}`;
    const thumbnailURL = `https://meepletron-storage.s3.us-east-2.amazonaws.com/${thumbnailPath}`;
    return { orginalURL, thumbnailURL };
  } catch (err) {
    console.log(err);
    return err;
  }
};

function cleanText(input) {
  if (!input) return "";

  // Decode HTML entities like &ndash;, &hellip;, &#10; (line breaks)
  let decoded = he.decode(input);

  // Remove excessive newlines, tabs, and spaces
  return decoded
    .replace(/[ \t]+/g, " ") // Replace multiple spaces and tabs with a single space
    .replace(/\n\s+/g, "\n") // Remove spaces after new lines
    .trim();
}
