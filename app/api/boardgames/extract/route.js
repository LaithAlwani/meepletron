import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { auth } from "@clerk/nextjs/server";

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export async function POST(req) {
  const { sessionClaims } = await auth();
  if (sessionClaims?.metadata?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  const data = await req.json();
  const url = typeof data === "string" ? data : data.url;
  const contentType = typeof data === "object" && data !== null ? data.contentType : null;

  if (!url) return NextResponse.json({ data: "File path or url missing" }, { status: 500 });

  try {
    let chunks;
    if (contentType && IMAGE_TYPES.includes(contentType)) {
      chunks = await extractFromImage(url);
    } else {
      const tempChunks = await getChunkedDocsFromPDF(url);
      chunks = cleanDocuments(tempChunks);
    }

    return NextResponse.json({ data: chunks, message: "Data Extracted" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to extract" }, { status: 500 });
  }
}

async function extractFromImage(url) {
  const google = createGoogleGenerativeAI();
  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: new URL(url) },
          {
            type: "text",
            text: "Extract all text from this image exactly as written. Preserve section headings and structure.",
          },
        ],
      },
    ],
  });

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const docs = await splitter.createDocuments([text]);
  return docs.map(({ pageContent, metadata }) => ({
    pageContent,
    metadata: {
      source: url,
      blobType: "image",
      totalPages: 1,
      loc: metadata.loc,
    },
  }));
}

function cleanDocuments(documents) {
  return documents.map(({ pageContent, metadata }) => ({
    pageContent,
    metadata: {
      source: metadata.source,
      blobType: metadata.blobType,
      totalPages: metadata.pdf.totalPages,
      loc: metadata.loc,
    },
  }));
}
