import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";


import { NextResponse } from "next/server";


export async function POST(req) {
  const data = await req.formData();
  const file = data.get("file");
  
  if (!file) {
    return NextResponse.json({ success: false });
  }
  try {
    const chunks = await getChunkedDocsFromPDF(file)
    return NextResponse.json({ data: chunks, message: "Data Embedded" }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to upload" }, { status: 500 });
  }
}
