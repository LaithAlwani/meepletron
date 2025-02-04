import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();
  const PDF_URL = data;
  const FILE_PATH = path.join(process.cwd(), "public", "temp.pdf");
  
  try {
    const chunks = await getChunkedDocsFromPDF(PDF_URL, FILE_PATH)
    
    return NextResponse.json({ data: chunks, message: "Data Embedded" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to upload" }, { status: 500 });
  }
}
