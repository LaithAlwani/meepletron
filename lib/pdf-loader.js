import fetch from "node-fetch";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

async function downloadPDF(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download PDF: ${response.statusText}`);
  const arrayBuffer = await await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  return fileBuffer;
}

// Function to parse PDF
async function parsePDF(buffer) {
  const blob = new Blob([buffer], { type: "application/pdf" });
  const loader = new PDFLoader(blob);
  const docs = await loader.load();
  return docs;
}

export async function getChunkedDocsFromPDF(url) {
  try {
    const pdfBuffer = await downloadPDF(url);
    const docs = await parsePDF(pdfBuffer) 

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(docs);
    return chunkedDocs;
  } catch (err) {
    console.log(err);
    throw new Error("PDF docs chunking failed!");
  }
}
