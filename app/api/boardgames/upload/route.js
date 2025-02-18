import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");
  const title = data.get("title");
  const id = data.get("id");

  if (!file || !title || !id)
    return NextResponse.json({ message: "please attach file" }, { status: 500 });
  const safeTitle = title.replace(/\s+/g, "_").toLowerCase();

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const pathDev = `_temp_boardgames/${safeTitle}_${Date.now()}_${file.name}`;
  const pathProd = `${safeTitle}_${id}/${file.name}`;

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: pathDev,
    Body: fileBuffer,
    ContentType: file.type,
  });

  try {
    await s3Client.send(uploadCommand);
    const url = `https://meepletron-storage.s3.us-east-2.amazonaws.com/${pathDev}`;
    return NextResponse.json({ data: url, message: "File uploaded successfully" }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 } // The webhook will retry 5 times waiting for a status 200
    );
  }
}
