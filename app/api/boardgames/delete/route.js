import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  const { boardgame } = await req.json();
  console.log(typeof boardgame._id)

  if (!boardgame) return NextResponse.json({ data: `please add board game id` }, { status: 500 });

  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
  const results = await pineconeIndex.query({
    vector: Array(1536).fill(0), // Dummy vector (not used because we filter)
    topK: 1000, // Retrieve as many matches as possible
    includeMetadata: true,
    filter: { bg_id:boardgame._id }, // Filter by bg_id
  });
  if (!results.matches.length) {
    return NextResponse.json({ message: "No documents found for the given boardgame id" }, {status:404})
  }

  const idsToDelete = results.matches.map((match) => match.id);
  await pineconeIndex.deleteMany(idsToDelete);
  
  
  
  const deleted = await deleteFiles(boardgame);
  if (!deleted) return NextResponse.json({ message: "Error in deleting files" }, { status: 500 });
  try {
    

    await connectToDB();
    const doc = await Boardgame.findByIdAndDelete({ _id: boardgame._id });
    return NextResponse.json({ message: `${doc.title} delete successfully` }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: `Failed to Upload file` }, { status: 500 });
  }
}

const deleteFiles = async (boardgame) => {
  const filePathinS3 = [];
  filePathinS3.push(boardgame?.image?.split("amazonaws.com/").pop());
  filePathinS3.push(boardgame?.thumbnail?.split("amazonaws.com/").pop());
  if (boardgame.wallpaper) filePathinS3.push(boardgame?.wallpaper?.split("amazonaws.com/").pop());
  if (boardgame.urls.length > 0) {
    boardgame.urls.forEach(({ path }) => {
      filePathinS3.push(path.split("amazonaws.com/").pop());
    });
  }

  try {
    const { Deleted } = await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: {
          Objects: filePathinS3.map((k) => ({ Key: k })),
        },
      })
    );

    return Deleted;
  } catch (caught) {
    if (caught.name === "NoSuchBucket") {
      console.error(
        `Error from S3 while deleting objects from ${process.env.AWS_BUCKET_NAME}. The bucket doesn't exist.`
      );
    } else if (caught) {
      console.error(
        `Error from S3 while deleting objects from ${process.env.AWS_BUCKET_NAME}.  ${caught.name}: ${caught.message}`
      );
    } else {
      throw caught;
    }
    return null;
  }
};
