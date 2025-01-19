import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function getChunkedDocsFromPDF(file) {
  try {
    const loader = new PDFLoader(file);
    const docs = await loader.load();
    // const textSplitter = new RecursiveCharacterTextSplitter({
    //   chunkSize: 512,
    //   chunkOverlap: 20,
    //   separators: ["\n\n", '\n', ".", " ", ""]
    // })
    
    // const chunkedDocs = await textSplitter.splitDocuments(docs);
    return docs;
  }

  catch (err) {
    console.log(err);
    throw new Error("PDF docs chunking failed!");
  }
}