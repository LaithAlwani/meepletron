import { OpenAIEmbeddings } from "@langchain/openai";

export async function queryPineconeVectorStore(client, indexName, searchQuery) {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });
  try {
    const embeddedQuery = await embeddings.embedQuery(searchQuery);

    const index = client.index(indexName);

    const queryResponse = await index.query({
      topK: 5,
      vector: embeddedQuery,
      includeMetadata: true,
      includeValues: false,
    });
    if (queryResponse.matches.length > 0) {
      const concatRetrievals = queryResponse.matches.map(match => `${match.metadata.text}`
      ).join();
      return concatRetrievals
    } else {
      return "no match"
    }
    
  } catch (err) {
    console.log(err);
    return "";
  }
}
