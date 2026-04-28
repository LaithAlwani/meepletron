import { OpenAIEmbeddings } from "@langchain/openai";

export async function queryPineconeVectorStore(client, indexName, searchQuery, id) {
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
  try {
    const embeddedQuery = await embeddings.embedQuery(searchQuery);
    const index = client.index(indexName);
    const queryResponse = await index.query({
      topK: 8,
      vector: embeddedQuery,
      includeMetadata: true,
      includeValues: false,
      filter: { bg_id: id },
    });
    const retrievals = queryResponse.matches
      .filter((match) => match.score >= 0.1)
      .map((match) => ({
        pageNumber: match.metadata["loc.pageNumber"],
        text: match.metadata.text,
        source: match.metadata.bg_refrence_url,
        score: match.score,
      }));
    return retrievals.length > 0 ? retrievals : [];
  } catch (err) {
    return err;
  }
}
