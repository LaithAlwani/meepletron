import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { boardgame } = await req.json();
  await connectToDB();
  // console.log(boardgame)
  try {
    const boardgameExist = await Boardgame.findOne({ bggId: boardgame.bggId });
    if (boardgameExist) return NextResponse.json({ data: "Boardgame exists" }, { status: 500 });
    
    const response = await fetch(boardgame.image);
    if (!response.ok) throw new Error("Failed to fetch image");

    const safeTitle = boardgame.title.replace(/\s+/g, "_").toLowerCase();
    
    const [imageBlob, thumbnailBlob] = await Promise.all([
      uploadImage(safeTitle, boardgame.image, "image"),
      uploadImage(safeTitle, boardgame.thumbnail, "thumbnail"),
    ]);
    boardgame.image = imageBlob.url
    boardgame.thumbnail = thumbnailBlob.url
    let parentDoc;
    let doc;
    console.log(boardgame)
    if (boardgame.is_expansion) {
      parentDoc = await Boardgame.findOne({ bggId: boardgame.parent_bgg_Id });
      console.log("parent ", parentDoc)
      doc = await Boardgame.create({
        ...boardgame,
        parent_bgg_id: parentDoc?.bggId,
        parent_id: parentDoc._id,
      });
    } else {
      doc = await Boardgame.create(boardgame);
    }

    return NextResponse.json({ data: boardgame.title }, { status: 201 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ data: "Failed to Add Boardgame" }, { status: 500 });
  }
}


const uploadImage = async (safeTitle,url, fileName) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);

  const imageBuffer = await response.arrayBuffer();
  const extension = url.split(".").pop().split("?")[0]; // Extract file extension

  // File path: boardgames/title/{image|thumbnail}.ext
  const filePath = `${safeTitle}/${fileName}.${extension}`;

  return await put(filePath, imageBuffer, {
    access: "public",
    contentType: response.headers.get("content-type"),
  });
};