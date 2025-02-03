import fs from "fs";
import fetch from "node-fetch";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";



async function downloadPDF(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download PDF: ${response.statusText}`);

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));
}

// Function to parse PDF
async function parsePDF(filePath) {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  fs.unlinkSync(filePath);
  return docs;
}

export async function getChunkedDocsFromPDF(url, filePath) {
  try {
    await downloadPDF(url, filePath);
    const docs = await parsePDF(filePath) 
    // const loader = new PDFLoader(file);
    // const docs = await loader.load();
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
