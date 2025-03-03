import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import path from "path";
import { NextResponse } from "next/server";
import { metadata } from "@/app/layout";

export async function POST(req) {
  const data = await req.json();
  const url = data;

  if (!url) return NextResponse.json({ data: "File path or url missing" }, { status: 500 });
  try {
    const tempChunks = await getChunkedDocsFromPDF(url);
    const chunks = cleanDocuments(tempChunks);
    
    return NextResponse.json({ data: chunks, message: "Data Extracted" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to upload" }, { status: 500 });
  }
}


function cleanDocuments(documents) {
  return documents.map(({ pageContent, metadata }) => ({
    pageContent,
    metadata: {
      source: metadata.source,
      blobType: metadata.blobType,
      totalPages: metadata.pdf.totalPages, // Move totalPages up
      loc: metadata.loc
    }
  }));
}