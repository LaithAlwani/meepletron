import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();
  const PDF_URL = data;
  const FILE_PATH = path.join(process.cwd(), "temp.pdf");
  if (!PDF_URL || !FILE_PATH)
    
    return NextResponse.json({ data: "File path or url missing" }, { status: 500 });
  try {
    const chunks = await getChunkedDocsFromPDF(PDF_URL, FILE_PATH);
    
    return NextResponse.json({ data: chunks, message: "Data Extracted" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to upload" }, { status: 500 });
  }
}
