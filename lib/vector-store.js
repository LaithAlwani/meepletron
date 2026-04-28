import { OpenAIEmbeddings } from "@langchain/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI();

async function rewriteQueryForRulebook(question) {
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      abortSignal: AbortSignal.timeout(5_000),
      temperature: 0,
      messages: [
        {
          role: "user",
          content: `Rewrite this board game question as a short, formal rulebook passage (1-2 sentences) that would appear in the answer. Only output the rewritten text.\n\nQuestion: ${question}`,
        },
      ],
    });
    return text?.trim() || question;
  } catch {
    return question;
  }
}

export async function queryPineconeVectorStore(client, indexName, searchQuery, id) {
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });

  try {
    const rewrittenQuery = await rewriteQueryForRulebook(searchQuery);
    const embeddedQuery = await embeddings.embedQuery(rewrittenQuery);
    const index = client.index(indexName);
    const queryResponse = await index.query({
      topK: 25,
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
