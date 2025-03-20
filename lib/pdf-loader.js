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

    const cleanedDocs = docs.map(doc => ({
      ...doc,
      pageContent: cleanText(doc.pageContent)
    }));

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(cleanedDocs);
    return chunkedDocs;
  } catch (err) {
    console.log(err);
    throw new Error("PDF docs chunking failed!");
  }
}


const cleanText = (text) => {
  return text
  .replace(/\r?\n/g, "\n") // Normalize line breaks (handling both \r\n and \n)
  .replace(/\n\s*\n/g, "\n\n") // Remove multiple new lines, leaving only one
  // Remove extra whitespace and empty lines
  .replace(/\s+/g, " ")
  // Remove non-printable and control characters
  .replace(/[^\x20-\x7E\n]/g, "") // Allow new lines as printable characters
  // Fix duplicate word issues like "LEADERLEADER"
  .replace(/\b(\w+)\1\b/g, "$1")
  // Remove standalone numbers or number sequences (but allow those that are part of headers)
  .replace(/\b\d+\b(?!\s*[\w])/g, "")
  // Fix word splitting issues (common in PDFs)
  .replace(/(\w)-\s+(\w)/g, "$1$2")
  // Trim leading and trailing whitespace
  .trim()
};