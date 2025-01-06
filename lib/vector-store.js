import { OpenAIEmbeddings } from "@langchain/openai";

export async function queryPineconeVectorStore(client, indexName, searchQuery, id) {
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });
  try {
    const embeddedQuery = await embeddings.embedQuery(searchQuery);
    const index = client.index(indexName);
    const queryResponse = await index.query({
      topK: 10,
      vector: embeddedQuery,
      includeMetadata: true,
      includeValues: false,
      filter: {
        bg_id: id
        //can also filter bg_title is included in searchQuery
      }
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
    console.log(err);
    return "";
  }
}
