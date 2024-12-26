import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function getChunkedDocsFromPDF(file) {
  try {
    // const loader = new PDFLoader(file);
    // const docs = await loader.load();
    
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap:200
    })
    
    const chunkedDocs = await textSplitter.splitText(file);

    return chunkedDocs;
  }

  catch (err) {
    console.log(err);
    throw new Error("PDF docs chunking failed!");
  }
}