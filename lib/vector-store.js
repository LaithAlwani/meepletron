import { OpenAIEmbeddings } from "@langchain/openai";

export async function queryPineconeVectorStore(client, indexName, searchQuery, id) {
  // const embeddings = new OpenAIEmbeddings({model: "text-embedding-3-small"});
  console.log("OPENAI KEY PRESENT:", !!process.env.OPENAI_API_KEY);
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
  

  try {
    const embeddedQuery = await embeddings.embedQuery(searchQuery);
    const index = client.index(indexName);
    const queryResponse = await index.query({
      topK: 25,
      vector: embeddedQuery,
      includeMetadata: true,
      includeValues: false,
      filter: {
        bg_id: id,
      },
    });
    console.log(queryResponse)
    
    if (queryResponse.matches.length > 0) {
      const retrievals = queryResponse.matches.map((match) => {
        return {
          pageNumber: match.metadata["loc.pageNumber"],
          text: match.metadata.text,
          source: match.metadata.bg_refrence_url,
          score: match.score
        };
      });

      return retrievals;
    } else {
      return "no match";
    }
  } catch (err) {
    return err;
  }
}
