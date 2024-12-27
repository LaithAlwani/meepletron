import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function getChunkedDocsFromPDF(file) {
  try {
    const loader = new PDFLoader(file);
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap:160
    })
    
    const chunkedDocs = await textSplitter.splitDocuments(docs);
    for (let i = 0; i < chunkedDocs.length; i++) {
      chunkedDocs[i].pageContent = chunkedDocs[i].pageContent.replace(/\n|\\n/g, "");
    }
    return chunkedDocs;
  }

  catch (err) {
    console.log(err);
    throw new Error("PDF docs chunking failed!");
  }
}