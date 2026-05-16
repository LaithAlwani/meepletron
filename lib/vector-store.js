// RAG retrieval layer for the rulebook chat.
//
// Supports two pipelines in parallel during migration:
//   - v1 (legacy): text-embedding-3-large vectors in PINECONE_INDEX_NAME.
//                  Old chunks, no breadcrumbs, just text + page number.
//   - v2 (new):    text-embedding-3-small vectors in PINECONE_INDEX_NAME_V2.
//                  Semantic chunks with breadcrumb, scope, variantName, chunkType.
//                  Legend chunks are always returned alongside vector hits.
//
// The `queryPineconeVectorStore` export keeps the old single-game API for
// backward compatibility. `retrieveForChat` is the new multi-source entry point.

import { OpenAIEmbeddings } from "@langchain/openai";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const V1_INDEX = process.env.PINECONE_INDEX_NAME;
const V2_INDEX = process.env.PINECONE_INDEX_NAME_V2;

const V1_TOPK = 6;
const V1_SCORE_THRESHOLD = 0.3;
// V2 defaults — overridable per-request via the `config` arg on
// `retrieveForChat` / `rerankChunks`. The chat route reads the active
// values from SiteConfig (admin-mutable at runtime) and forwards them here.
const DEFAULT_V2_TOPK = 10;
const DEFAULT_V2_SCORE_THRESHOLD = 0.05;
const V2_VECTOR_DIM = 1536;
const DEFAULT_RERANK_N = 3;

// --------------------------------------------------------------------------
// Legacy single-game retrieval (v1). Kept for the chat route's existing
// behavior while we migrate games. Will be removed after all games are v2.
// --------------------------------------------------------------------------
export async function queryPineconeVectorStore(client, indexName, searchQuery, id) {
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
  try {
    const vector = await embeddings.embedQuery(searchQuery);
    const index = client.index(indexName);
    const response = await index.query({
      topK: V1_TOPK,
      vector,
      includeMetadata: true,
      includeValues: false,
      filter: { bg_id: id },
    });
    return response.matches
      .filter((m) => m.score >= V1_SCORE_THRESHOLD)
      .map((m) => ({
        pageNumber: m.metadata["loc.pageNumber"],
        text: m.metadata.text,
        source: m.metadata.bg_refrence_url,
        score: m.score,
      }));
  } catch (err) {
    return err;
  }
}

// --------------------------------------------------------------------------
// New multi-source entry point. Handles a mix of v1 and v2 games in one query.
//
// @param {object} args
// @param {PineconeClient} args.client
// @param {string} args.query  — the user's question
// @param {Array<{ id: string, embed_version: 1|2, title?: string }>} args.boardgames
// @param {{ v2TopK?: number, v2ScoreThreshold?: number }} [args.config]
//   Runtime overrides from SiteConfig; falls back to module defaults.
// @returns {Promise<{ chunks: Chunk[], legendChunks: Chunk[], embedUsage: object | null }>}
//
// `chunks` are vector-ranked results; `legendChunks` are always-included
// iconography chunks (v2 only) that the chat route prepends as system context.
// `embedUsage` is the OpenAI embedding usage (small) so the chat route can log it.
// --------------------------------------------------------------------------
export async function retrieveForChat({ client, query, boardgames, config = {} }) {
  if (!boardgames?.length) return { chunks: [], legendChunks: [], embedUsage: null };

  const v1 = boardgames.filter((g) => g.embed_version !== 2);
  const v2 = boardgames.filter((g) => g.embed_version === 2);

  const [v1Chunks, v2Result] = await Promise.all([
    v1.length > 0 ? retrieveV1Multi(client, query, v1) : Promise.resolve([]),
    v2.length > 0
      ? retrieveV2Multi(client, query, v2, config)
      : Promise.resolve({ chunks: [], legendChunks: [], embedUsage: null }),
  ]);

  return {
    chunks: [...v2Result.chunks, ...v1Chunks],
    legendChunks: v2Result.legendChunks,
    embedUsage: v2Result.embedUsage,
  };
}

async function retrieveV1Multi(client, query, games) {
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
  const vector = await embeddings.embedQuery(query);
  const index = client.index(V1_INDEX);
  const ids = games.map((g) => g.id);
  const titleById = new Map(games.map((g) => [g.id, g.title || null]));

  const response = await index.query({
    topK: V1_TOPK,
    vector,
    includeMetadata: true,
    includeValues: false,
    filter: { bg_id: { $in: ids } },
  });

  return response.matches
    .filter((m) => m.score >= V1_SCORE_THRESHOLD)
    .map((m) => ({
      text: m.metadata.text,
      score: m.score,
      bg_id: m.metadata.bg_id,
      bg_title: m.metadata.bg_title || titleById.get(m.metadata.bg_id) || null,
      breadcrumb: null,
      page: m.metadata["loc.pageNumber"] ?? null,
      chunkType: "text",
      scope: "main",
      variantName: null,
      source: m.metadata.bg_refrence_url || null,
      embedVersion: 1,
    }));
}

async function retrieveV2Multi(client, query, games, config = {}) {
  if (!V2_INDEX) {
    // V2 index not configured — fall back to empty v2 result so the system
    // degrades gracefully to v1-only.
    return { chunks: [], legendChunks: [], embedUsage: null };
  }

  const topK = config.v2TopK ?? DEFAULT_V2_TOPK;
  const scoreThreshold = config.v2ScoreThreshold ?? DEFAULT_V2_SCORE_THRESHOLD;

  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
  const vector = await embeddings.embedQuery(query);
  const index = client.index(V2_INDEX);
  const ids = games.map((g) => g.id);

  // Main vector search — exclude legend chunks (those are fetched separately
  // so they're always included regardless of similarity score).
  const mainQuery = index.query({
    topK,
    vector,
    includeMetadata: true,
    includeValues: false,
    filter: {
      bg_id: { $in: ids },
      chunkType: { $ne: "legend" },
    },
  });

  // Legend chunks — always-on context. Pinecone has no "fetch by metadata"
  // API, so we use a zero-vector query with a permissive topK and rely on
  // the filter to narrow to exactly the legend chunks for the active sources.
  const legendQuery = index.query({
    topK: Math.max(games.length * 3, 5),
    vector: new Array(V2_VECTOR_DIM).fill(0),
    includeMetadata: true,
    includeValues: false,
    filter: {
      bg_id: { $in: ids },
      chunkType: "legend",
    },
  });

  const [mainResp, legendResp] = await Promise.all([mainQuery, legendQuery]);

  const chunks = mainResp.matches
    .filter((m) => m.score >= scoreThreshold)
    .map(mapV2Match);

  const legendChunks = legendResp.matches.map(mapV2Match);

  // The OpenAIEmbeddings wrapper doesn't expose usage on a single embedQuery
  // call — we approximate prompt tokens from the query length so the admin
  // dashboard at least sees that embedding happened. Better than zero.
  const embedUsage = {
    promptTokens: Math.ceil(query.length / 4),
    completionTokens: 0,
    totalTokens: Math.ceil(query.length / 4),
  };

  return { chunks, legendChunks, embedUsage };
}

function mapV2Match(m) {
  return {
    text: m.metadata.text,
    score: m.score,
    bg_id: m.metadata.bg_id,
    bg_title: m.metadata.bg_title || null,
    breadcrumb: m.metadata.breadcrumb || null,
    page: typeof m.metadata.page === "number" ? m.metadata.page : null,
    chunkType: m.metadata.chunkType || "text",
    scope: m.metadata.scope || "main",
    variantName: m.metadata.variantName || null,
    source: m.metadata.bg_refrence_url || null,
    embedVersion: 2,
  };
}

// --------------------------------------------------------------------------
// LLM reranking. Takes the broad set of retrieved chunks + the user query,
// returns the N most relevant in order. Single Gemini Flash call, ~$0.00005
// per query. Falls back to top-N by vector score if the model misbehaves.
// --------------------------------------------------------------------------
export async function rerankChunks(query, chunks, n = DEFAULT_RERANK_N) {
  if (!chunks || chunks.length === 0) return { chunks: [], usage: null };
  if (chunks.length <= n) return { chunks: chunks.slice(0, n), usage: null };

  const numbered = chunks
    .map((c, i) => {
      const header = [
        c.bg_title,
        c.breadcrumb,
        c.page ? `p.${c.page}` : null,
        c.scope === "variant" && c.variantName ? `Variant: ${c.variantName}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const body = c.text.length > 800 ? `${c.text.slice(0, 800)}…` : c.text;
      return `[${i + 1}] ${header || "(no header)"}\n${body}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are reranking passages from a board game rulebook for a user's question. Pick the ${n} passages MOST relevant to actually answering the user. Prefer passages that directly state the rule over passages that merely mention the topic.

If the question spans multiple sub-topics (e.g. "how does combat work end-to-end"), prefer DIVERSE passages that cover different sub-topics over near-duplicate passages from the same section.

Output ONLY a JSON array of the chosen passage numbers, in order of relevance. Example: [3, 12, 1, 7, 5]
No other text. No explanation. No code fences. Just the array.

User question: ${query}

Candidate passages:
${numbered}`;

  try {
    const { text, usage } = await generateText({
      model: google("gemini-2.5-flash"),
      temperature: 0,
      maxRetries: 1,
      messages: [{ role: "user", content: prompt }],
    });
    const match = text.match(/\[[\s\d,]+\]/);
    if (!match) return { chunks: chunks.slice(0, n), usage };
    const indices = JSON.parse(match[0]);
    const seen = new Set();
    const selected = [];
    for (const i of indices) {
      if (!Number.isInteger(i) || i < 1 || i > chunks.length) continue;
      if (seen.has(i)) continue;
      seen.add(i);
      selected.push(chunks[i - 1]);
      if (selected.length >= n) break;
    }
    return {
      chunks: selected.length > 0 ? selected : chunks.slice(0, n),
      usage,
    };
  } catch (err) {
    console.error("[rerank] failed; falling back to top-N by vector score:", err);
    return { chunks: chunks.slice(0, n), usage: null };
  }
}
