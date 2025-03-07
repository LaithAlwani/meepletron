import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
  const filename = data.get("filename");
  const filetype = data.get("filetype");
  const id = data.get("id");

  if (!filename || !id)
    return NextResponse.json({ message: "please attach file" }, { status: 500 });

  const pathDev = `_temp_boardgames/resources/${filename}`;
  const pathProd = `resources/${filename}`;

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: process.env.NODE_ENV != "production" ? pathDev : pathProd,
    ContentType: filetype,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, uploadCommand, { expiresIn: 3600 });
    const urlData = {
      signedUrl,
      objectUrl: `https://meepletron-storage.s3.us-east-2.amazonaws.com/${process.env.NODE_ENV !="production" ? pathDev:pathProd}`
    }
    return NextResponse.json(
      { urlData, message: "File uploaded successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 } // The webhook will retry 5 times waiting for a status 200
    );
  }
}
