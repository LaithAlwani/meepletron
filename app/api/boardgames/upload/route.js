import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function POST(req) {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  const reqUrl = new URL(req.url);
  const isTemp = reqUrl.searchParams.get("temp") === "true";

  const data = await req.formData();
  const filename = data.get("filename");
  const filetype = data.get("filetype");
  const id = data.get("id");

  if (!filename || (!id && !isTemp))
    return NextResponse.json({ message: "please attach file" }, { status: 500 });

  if (!ALLOWED_FILE_TYPES.includes(filetype))
    return NextResponse.json({ message: "Invalid file type" }, { status: 400 });

  let key;
  if (isTemp) {
    const ext = filename.split(".").pop();
    const uuid = crypto.randomUUID();
    key = process.env.NODE_ENV !== "production"
      ? `_temp_boardgames/resources/temp-${uuid}.${ext}`
      : `resources/temp-${uuid}.${ext}`;
  } else {
    key = process.env.NODE_ENV !== "production"
      ? `_temp_boardgames/resources/${filename}`
      : `resources/${filename}`;
  }

  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: filetype,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, uploadCommand, { expiresIn: 3600 });
    const urlData = {
      signedUrl,
      objectUrl: `https://meepletron-storage.s3.us-east-2.amazonaws.com/${key}`,
    };
    return NextResponse.json(
      { urlData, message: "File uploaded successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
