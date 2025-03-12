import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import Boardgame from "@/models/boardgame";
import connectToDB from "@/utils/database";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Expansion from "@/models/expansion";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  //check if user is authorized to delete games.
  const { sessionClaims } = await auth();

  // Access the public metadata
  const publicMetadata = sessionClaims?.metadata;

  // Check if the user's role is 'admin'
  if (publicMetadata.role !== "admin") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { boardgame } = await req.json();

  //check if boardgame exits.
  if (!boardgame)
    return NextResponse.json({ message: `Please provide a boardgame` }, { status: 404 });
  if (!boardgame.urls.length)
    return NextResponse.json({ message: `No files to delete` }, { status: 404 });
  try {
    //delet docs from pincone
    await deletePinconeDocs(boardgame._id);
    // delete fiels from s3 bucket
    await deleteFiles(boardgame);

    await connectToDB();
    let doc;
    if (boardgame.parent_id) {
      doc = await Expansion.findByIdAndUpdate({ _id: boardgame._id }, { urls: [] }, { new: true });
    } else {
      doc = await Boardgame.findByIdAndUpdate({ _id: boardgame._id }, { urls: [] }, { new: true });
    }
    if (!doc)
      return NextResponse.json({ message: `The Board Game does not exist` }, { status: 404 });
    return NextResponse.json(
      { data: doc, message: `${doc.title} delete successfully` },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ message: `Failed to Upload file` }, { status: 500 });
  }
}

const deleteFiles = async (boardgame) => {
  const filePathinS3 = [];
  boardgame.urls.forEach(({ path }) => {
    filePathinS3.push(path.split("amazonaws.com/").pop());
  });

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

const deletePinconeDocs = async (id) => {
  const pinecone = new PineconeClient();
  const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
  try {
    const results = await pineconeIndex.query({
      vector: Array(3072).fill(0), // Dummy vector (not used because we filter)
      topK: 1000, // Retrieve as many matches as possible
      includeMetadata: true,
      filter: { bg_id: id }, // Filter by bg_id
    });
    if (!results.matches.length) {
      return NextResponse.json(
        { message: "No documents found for the given boardgame id" },
        { status: 404 }
      );
    }

    const idsToDelete = results.matches.map((match) => match.id);
    await pineconeIndex.deleteMany(idsToDelete);
  } catch (err) {
    return NextResponse.json({ message: `failed to delete docs from Pincode DB` }, { status: 500 });
  }
};
