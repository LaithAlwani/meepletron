// PDF → structured Markdown via Gemini 2.5 Flash.
//
// Replaces the old PDFLoader + cleanText pipeline. Gemini's vision capability
// lets us:
//   - preserve section/subsection hierarchy as markdown headers
//   - keep tables intact as markdown tables
//   - keep numbered/bulleted lists intact
//   - transcribe inline ICONS to bracketed tokens like [WOOD], [VP], [ATTACK]
//   - extract the rulebook's iconography legend as a dedicated section
//   - mark page boundaries with `<!-- page N -->` HTML comments
//
// Large rulebooks (>20 MB or too slow for a single 60s Vercel function call)
// are sliced into page-range batches by `lib/pdf-splitter.js` and each batch
// is sent through `extractMarkdownFromBuffer` separately. `extractMarkdownFromPDF`
// is kept as a thin convenience wrapper that downloads and parses a whole PDF
// in one call (only safe for small books).

import fetch from "node-fetch";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_PDF_HOST = "meepletron-storage.s3.us-east-2.amazonaws.com";

// Reused for every PDF download. The S3 bucket isn't publicly readable, so
// we sign each GET with the same credentials the upload route uses — the
// resulting URL embeds short-lived auth and works against any object the
// IAM principal can read.
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function signS3GetUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.hostname !== ALLOWED_PDF_HOST) {
    throw new Error("URL not allowed");
  }
  const key = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 60 * 15 });
}

const EXTRACTION_PROMPT = `You are converting a board game rulebook PDF into clean, structured Markdown that will be used by a downstream RAG (retrieval) system. Follow these rules exactly.

# Output format

1. **Section hierarchy** — Use markdown headers \`#\`, \`##\`, \`###\` to mirror the rulebook's actual section structure. The rulebook title (if shown) is the only \`#\`. Major sections like "Setup", "Turn Order", "Combat", "Scoring", "Variants" are \`##\`. Subsections within those are \`###\`. Do not invent headings — use the rulebook's wording verbatim.

2. **Lists** — Preserve numbered and bulleted lists using markdown syntax (\`1.\`, \`-\`).

3. **Tables** — When the rulebook shows a table (resource costs, scoring chart, dice results, etc.), reproduce it as a markdown table. Keep every row. Never split a table across multiple chunks; if it's large, render it as one continuous table.

4. **Page boundaries** — At the start of each new page in the source PDF, insert a line: \`<!-- page N -->\` where N is the 1-based page number. This is required for citation.

5. **Numbers, dice, quantities** — Preserve all numeric content verbatim. Never strip or paraphrase numbers. "Roll 2d6", "2-4 players", "Draw 5 cards" must remain exactly as written.

6. **Bold / italic** — Preserve emphasis (\`**bold**\`, \`*italic*\`) where the rulebook uses it for rule names, defined terms, or callouts.

7. **Line wrapping** — PDFs visually wrap prose across multiple lines mid-sentence. In your markdown output, **join wrapped lines into a single line** — a paragraph should be ONE continuous line of text, no internal newlines. Use blank lines (\`\\n\\n\`) only between actual paragraphs. Preserve real line breaks ONLY inside lists, tables, code blocks, and headings — never inside prose paragraphs. Example: if the PDF shows "You must draw exactly **1** new\\n**land tile** from a stack\\nand place it faceup", output it as "You must draw exactly **1** new **land tile** from a stack and place it faceup" on a single line.

# Verbatim only — never use your training data

Your knowledge of board games from your training data is **not a source**. You may recognise the game from the cover or layout — that recognition gives you ZERO authority to add, complete, correct, or "improve" anything.

- If the rulebook prints something, transcribe it exactly.
- If the rulebook doesn't print something, omit it. Even if you "know" the correct value from training. Even if the rulebook seems to be missing a number or condition. Silence is the right output.
- Never paraphrase a rule into "clearer" language. The rulebook's wording wins, even when awkward.
- Never expand abbreviations, define terms, or add parentheticals that weren't printed.
- Never insert clarifying examples that weren't in the source.

If asked to choose between (a) writing what the rulebook printed and (b) writing what's actually correct, always choose (a).

# Iconography (very important)

Board game rulebooks rely heavily on icons (resource symbols, action symbols, card types, etc.). You must:

(a) **Detect the iconography legend.** Most rulebooks have a section titled "Components", "Symbols", "Iconography", "Icon Glossary", "Game Materials", or similar — typically in the first 1–3 pages. Render this section as a markdown heading exactly \`## Iconography\` (rename if the source title differs — we standardize on "Iconography"). Inside it, describe every game-specific icon as a bullet list:

   \`\`\`
   ## Iconography
   - **[WOOD]** — a brown lumber log icon, represents the wood resource card
   - **[SHEEP]** — a white sheep icon, represents the wool resource card
   - **[VP]** — a yellow star icon, represents a victory point
   \`\`\`

   Use ALL_CAPS token names. Keep token names short and meaningful (\`[WOOD]\` not \`[WOOD_RESOURCE_CARD_ICON_BROWN]\`).

(b) **Transcribe inline icons everywhere.** Throughout the rest of the rulebook, whenever an icon appears inline in the text, replace it with its bracketed token: "Draw a [WOOD] and a [SHEEP]" not "Draw a 🪵 and a 🐑" and not "Draw a wood and a sheep".

(c) **Be consistent.** Once you've named an icon \`[WOOD]\`, use \`[WOOD]\` for every subsequent occurrence. Never invent new tokens mid-document.

(d) **If no legend exists**, still transcribe icons inline using your best-guess names, and put a brief inferred legend under \`## Iconography\` based on context clues. Mark inferred entries with "(inferred)" in the description.

(e) **Ignore everything else.** If a graphic isn't a repeating game icon defined in the Iconography legend (e.g. it's an illustration, example board, card mockup, decorative artwork, or photograph), skip it entirely. Don't describe it. Don't transcribe any text rendered inside it. Continue with the surrounding rulebook prose as if the image weren't there.

# Variants and optional rules

If the rulebook contains sections titled "Variants", "Optional Rules", "Advanced Rules", "Tournament Rules", "Two-Player Variant", "Solo Mode", or similar, keep them under their existing heading. The downstream chunker will detect these and tag them appropriately — you don't need to change anything.

# What NOT to do

- Don't add commentary, explanations, or notes that aren't in the original rulebook.
- Don't summarize or paraphrase — convert verbatim with markdown structure overlaid.
- Don't skip pages or sections, even if they seem repetitive.
- Don't add a preamble, table of contents, or footer of your own. Begin output immediately with the rulebook title or the first heading.
- Don't include image descriptions for decorative art (only describe icons in the Iconography legend).
- Don't supplement the rulebook from your training data. If a sentence in the PDF refers to a rule you remember in detail from training, transcribe only the PDF's sentence — never the remembered detail.
- Don't fill in gaps that the rulebook leaves implicit. Implicit means the author chose not to spell it out; you don't get to spell it out for them.

Begin your markdown output now. Do not wrap it in code fences. Do not add any text before or after.`;

/**
 * Download a PDF from the allowed S3 host. Throws on invalid host or HTTP error.
 * Returns the raw bytes and the byte length.
 *
 * The S3 bucket is private — we sign every GET with the same IAM credentials
 * the upload route uses, so the anonymous-403 case is avoided.
 */
export async function downloadPDF(url) {
  const signedUrl = await signS3GetUrl(url);

  const response = await fetch(signedUrl, { signal: AbortSignal.timeout(30000) });
  if (response.status === 404) {
    throw new Error(`PDF not found at S3 URL (404). The file may have been renamed or deleted — re-upload the rulebook from the edit screen.`);
  }
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return { buffer, byteLength: buffer.length };
}

/**
 * Collapse mid-paragraph line wraps to single spaces. Preserves blank-line
 * paragraph breaks, list items, tables, headings, blockquotes, page comments,
 * and code fences. Deterministic, fast, idempotent.
 *
 * Safety net behind the prompt's "Line wrapping" rule.
 */
export function joinWrappedLines(markdown) {
  if (!markdown) return markdown;
  return markdown
    .replace(
      // A single \n that is NOT followed by a structural marker (or another \n).
      // The lookahead lets us keep newlines that introduce list items, tables,
      // headings, blockquotes, page comments, or code fences.
      /([^\n])\n(?!\n|#{1,6}\s|[-*+]\s|\d+\.\s|\|\s?|>\s|<!--|```)/g,
      (_, prev) => `${prev} `,
    )
    .replace(/[ \t]+/g, " ");
}

/**
 * Rewrite `<!-- page N -->` comments to `<!-- page (N + offset) -->`.
 * Used when we send Gemini a sliced PDF — it sees pages 1..k of the slice
 * but the original PDF's page numbers are k..k+offset.
 */
export function offsetPageMarkers(markdown, offset) {
  if (!offset) return markdown;
  return markdown.replace(/<!--\s*page\s+(\d+)\s*-->/gi, (_, n) => {
    return `<!-- page ${Number(n) + offset} -->`;
  });
}

/**
 * Parse the `## Iconography` (or similar) section out of the markdown and
 * return the list of bracketed token names. Used by the batch flow to keep
 * later batches consistent with the first batch's icon definitions.
 */
export function extractIconTokens(markdown) {
  if (!markdown) return [];
  // Find the iconography section: a heading line whose text matches our
  // detector, followed by lines until the next heading at the same level
  // or higher.
  const lines = markdown.split("\n");
  const headingRe = /^(#{1,6})\s+(.+)$/;
  const legendHeadingRe = /^(iconography|symbols?|icon glossary|game (components|materials)|key)\b/i;
  let inLegend = false;
  let legendLevel = 0;
  const tokens = new Set();
  for (const line of lines) {
    const headingMatch = line.match(headingRe);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (inLegend && level <= legendLevel) {
        inLegend = false;
      }
      if (!inLegend && legendHeadingRe.test(text)) {
        inLegend = true;
        legendLevel = level;
        continue;
      }
    }
    if (inLegend) {
      // Tokens look like **[NAME]** or [NAME] in bullet/list lines.
      const matches = line.matchAll(/\[([A-Z][A-Z0-9_]*)\]/g);
      for (const m of matches) tokens.add(m[1]);
    }
  }
  return Array.from(tokens);
}

function buildKnownTokensHint(knownIconTokens) {
  if (!knownIconTokens?.length) return "";
  const list = knownIconTokens.map((t) => `[${t}]`).join(", ");
  return `

# Known iconography tokens (from earlier pages of this same rulebook)

The following icon tokens have already been defined for this rulebook: ${list}.
- Use these EXACT tokens whenever the corresponding icon appears in the pages you're parsing now.
- Do NOT re-emit a \`## Iconography\` section — the legend is already captured.
- If you encounter a new icon not in this list, you may introduce a new token using the same ALL_CAPS bracketed convention.`;
}

/**
 * Extract a PDF buffer to markdown via Gemini. Lower-level entry point used
 * by the batched migration flow.
 *
 * @param {Buffer} pdfBuffer  Raw PDF bytes (whole or sliced).
 * @param {object} [options]
 * @param {number} [options.pageNumberOffset=0]
 *   Added to every `<!-- page N -->` marker Gemini emits. When parsing pages
 *   11..20 of a larger PDF, set this to 10 so the markers reflect original
 *   page numbers.
 * @param {string[]} [options.knownIconTokens=[]]
 *   Token names already defined by earlier batches. Appended to the prompt
 *   so Gemini stays consistent across batches.
 * @returns {Promise<{ markdown: string, usage: object | undefined }>}
 */
export async function extractMarkdownFromBuffer(
  pdfBuffer,
  { pageNumberOffset = 0, knownIconTokens = [] } = {},
) {
  const prompt = EXTRACTION_PROMPT + buildKnownTokensHint(knownIconTokens);

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    temperature: 0,
    maxRetries: 2,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "file",
            data: pdfBuffer,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
  });

  let markdown = (result.text || "").trim();
  if (!markdown) throw new Error("Gemini returned empty markdown");

  markdown = offsetPageMarkers(markdown, pageNumberOffset);
  markdown = joinWrappedLines(markdown);

  return {
    markdown,
    usage: result.usage,
  };
}

/**
 * Convenience wrapper: download and parse a whole PDF in one call. Safe only
 * for PDFs that fit Gemini's 20 MB inline cap AND complete within ~60 s. For
 * anything larger, slice the PDF with `lib/pdf-splitter.js` and call
 * `extractMarkdownFromBuffer` per page-range batch instead.
 */
export async function extractMarkdownFromPDF(url) {
  const { buffer } = await downloadPDF(url);
  return extractMarkdownFromBuffer(buffer);
}
