import { OpenAIEmbeddings } from "@langchain/openai";
import  {google}  from "@ai-sdk/google";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import {  VertexAIEmbeddings } from "@langchain/google-vertexai";

export async function queryPineconeVectorStore(client, indexName, searchQuery, id) {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });
  // const embeddings = new VertexAIEmbeddings({
  //   model: "text-embedding-004",
  // });
  
  try {
    const embeddedQuery = await embeddings.embedQuery(searchQuery);
    const index = client.index(indexName);
    const queryResponse = await index.query({
      topK: 3,
      vector: embeddedQuery,
      includeMetadata: true,
      includeValues: false,
      filter: {
        bg_id: id,
      },
    });
    if (queryResponse.matches.length > 0) {
      const concatRetrievals = queryResponse.matches
        .map((match) => {
          return `${match.metadata.text}`;
        })
        .join();

      return concatRetrievals;
    } else {
      return "no match";
    }
  } catch (err) {
    return err;
  }
}
