// Semantic chunker for rulebook markdown produced by `lib/markdown-extractor.js`.
//
// Splits on h2/h3 headings, keeps tables and legend sections intact, sub-splits
// long sections with RecursiveCharacterTextSplitter, tags chunks with:
//   - breadcrumb (e.g. "Combat > Resolving attacks")
//   - page (from <!-- page N --> markers in the markdown)
//   - chunkType: "text" | "table" | "list" | "legend"
//   - scope: "main" | "variant"
//   - variantName
//   - flags[]: auto-detected quality issues for the migration review UI
//
// Pure function — no I/O, easy to test.

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const VARIANT_PATTERNS = [
  /^variants?\b/i,
  /^optional rules?\b/i,
  /^advanced rules?\b/i,
  /^tournament\b/i,
  /^two[- ]player( rules?| variant| mode)?\b/i,
  /^solo( rules?| mode| variant)?\b/i,
  /^house rules?\b/i,
  /^alternate\b/i,
];

const LEGEND_HEADING = /^(iconography|symbols?|icon glossary|game (components|materials)|key)\b/i;

const DEFAULT_MAX_CHUNK_SIZE = 2000;
const DEFAULT_CHUNK_OVERLAP = 200;
const FLAG_THRESHOLDS = {
  tooShort: 50,
  tooLong: 4000,
  // Fraction of "junk" chars (not letters, digits, whitespace, or any normal
  // punctuation/markdown syntax) above which we suspect PDF-extraction garbage.
  // Tightened from 0.15 → 0.12 as a safety net behind the extractor prompt's
  // "skip images" rule — legitimate prose / tables / lists sit well under 5%;
  // image-OCR noise typically spikes above 15%.
  maxJunkRatio: 0.12,
  // Word-density signal for "image-OCR noise looks word-shaped but isn't English."
  // If a chunk is long enough to be meaningful (> 80 chars) AND its longest
  // alphabetic run is shorter than this many characters, the chunk is almost
  // certainly fragmented OCR (e.g. "VP 3 ATK 2 def shld card draw"). Catches
  // image-derived gibberish that slips past the junkCharRatio test.
  minWordRunLengthForLongChunk: 4,
  longChunkThresholdForWordRun: 80,
  minTableRows: 4, // header + separator + at least 2 data rows
};

// Chars that are expected in rulebook text and never indicate PDF garbage:
// letters, digits, whitespace, ASCII punctuation, common typographic
// punctuation (— – • · " " ' ' …), markdown syntax (* _ # | > ` ~ + - / = $ %).
const VALID_CHAR_RE = /[\w\s.,;:!?'"()\[\]{}\-—–•·*#|>`~+/$%&=@°ñáéíóúü“”‘’…]/;

/**
 * Convert a markdown rulebook (from extractor) into structured chunks.
 *
 * Returns `{ chunks, removedDuplicates }`. Exact-text duplicate chunks (same
 * prepended-breadcrumb + body) are silently dropped — these are almost always
 * PDF artifacts (repeated page headers/footers/TOC entries), never useful to
 * the model. The count of removed duplicates is reported so the migration UI
 * can show "N duplicates removed" for transparency.
 *
 * @param {string} markdown
 * @param {object} [options]
 * @param {number} [options.maxChunkSize=2000]
 * @param {number} [options.chunkOverlap=200]
 * @returns {Promise<{ chunks: Chunk[], removedDuplicates: number }>}
 */
export async function chunkMarkdown(markdown, options = {}) {
  const maxChunkSize = options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;

  const sections = parseSections(markdown);
  const rawChunks = [];
  for (const section of sections) {
    const subChunks = await materializeSection(section, { maxChunkSize, chunkOverlap });
    rawChunks.push(...subChunks);
  }

  // Safety net: if structural parsing produced ZERO chunks but the markdown
  // clearly has substantive content (the extractor sometimes emits prose
  // outside of any heading, or the headings get filtered out), fall back to
  // a single unstructured chunk with the body so admin review isn't stranded
  // with an empty list. The chunk is flagged so it's obvious in the UI.
  if (rawChunks.length === 0) {
    const bodyOnly = stripHeadingsAndPageMarkers(markdown).trim();
    if (bodyOnly.length > 100) {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: maxChunkSize,
        chunkOverlap,
        separators: ["\n\n", "\n", ". ", " ", ""],
      });
      const parts = await splitter.splitText(bodyOnly);
      for (const part of parts) {
        rawChunks.push({
          breadcrumb: "",
          breadcrumbParts: [],
          page: null,
          chunkType: "text",
          scope: "main",
          variantName: null,
          text: part,
        });
      }
    }
  }

  // Drop exact-text duplicates (after breadcrumb prepending). Same breadcrumb +
  // same body = same chunk regardless of which page it appeared on.
  const seen = new Set();
  const exactDeduped = [];
  let removedDuplicates = 0;
  for (const chunk of rawChunks) {
    const key = chunk.text.trim();
    if (seen.has(key)) {
      removedDuplicates++;
      continue;
    }
    seen.add(key);
    exactDeduped.push(chunk);
  }

  // Drop prefix-duplicates: if chunk A's full text is the start of chunk B's
  // text (and A is "substantial" so we're not dropping legit short headers),
  // A is just a truncated version of B. This catches batch-boundary artifacts
  // where Gemini emits a section in batch N and re-emits it (longer) in
  // batch N+1, or where the splitter produced near-identical overlapping
  // slices.
  const prefixDeduped = [];
  const droppedIdxs = new Set();
  for (let i = 0; i < exactDeduped.length; i++) {
    if (droppedIdxs.has(i)) continue;
    const a = exactDeduped[i].text.trim();
    if (a.length < 200) {
      prefixDeduped.push(exactDeduped[i]);
      continue;
    }
    let isPrefixOfOther = false;
    for (let j = 0; j < exactDeduped.length; j++) {
      if (i === j || droppedIdxs.has(j)) continue;
      const b = exactDeduped[j].text.trim();
      if (b.length > a.length && b.startsWith(a)) {
        // a is a strict prefix of b — drop a, keep b
        isPrefixOfOther = true;
        break;
      }
    }
    if (isPrefixOfOther) {
      removedDuplicates++;
      droppedIdxs.add(i);
    } else {
      prefixDeduped.push(exactDeduped[i]);
    }
  }

  // Diagnostic for the "where are my ### chunks" debugging — easy to grep in
  // Vercel logs to see what level distribution actually came out.
  const levelCounts = {};
  for (const c of prefixDeduped) {
    const depth = (c.breadcrumbParts?.length ?? 0) + 1; // +1 because level 2 = depth 1
    levelCounts[`h${depth + 1}`] = (levelCounts[`h${depth + 1}`] || 0) + 1;
  }
  console.log("[chunker] sections by depth:", levelCounts, "total chunks:", prefixDeduped.length);

  return {
    chunks: applyFlags(prefixDeduped),
    removedDuplicates,
  };
}

function stripHeadingsAndPageMarkers(markdown) {
  return markdown
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true; // keep blank lines for paragraph breaks
      if (trimmed.startsWith("<!--")) return false; // page markers
      if (/^#{1,6}\s/.test(trimmed)) return false; // markdown headings
      return true;
    })
    .join("\n");
}

// --- Section parsing ---------------------------------------------------------

function parseSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let currentPage = null;
  let headingStack = []; // [{ level, text }]
  let pendingContent = [];
  let pendingPage = null;

  function flushSection() {
    const text = pendingContent.join("\n").trim();
    pendingContent = [];
    if (!text) return;

    // Skip level-1 headings (`#`) — that's the rulebook's title, which is
    // already on the game record. The breadcrumb should describe the SECTION
    // path within the rulebook, not "Game > Section > …".
    const breadcrumbParts = headingStack
      .filter((h) => h.level >= 2)
      .map((h) => h.text);
    const breadcrumb = breadcrumbParts.join(" > ");

    const isLegend = headingStack.some(
      (h) => h.level <= 3 && LEGEND_HEADING.test(h.text),
    );
    const variantHeading = headingStack.find(
      (h) => h.level >= 2 && VARIANT_PATTERNS.some((p) => p.test(h.text)),
    );

    sections.push({
      breadcrumb,
      breadcrumbParts,
      chunkType: isLegend ? "legend" : detectChunkType(text),
      scope: variantHeading ? "variant" : "main",
      variantName: variantHeading?.text ?? null,
      page: pendingPage,
      content: text,
    });
  }

  for (const line of lines) {
    // Page-boundary comment
    const pageMatch = line.match(/<!--\s*page\s+(\d+)\s*-->/);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      if (pendingPage === null) pendingPage = currentPage;
      continue;
    }

    // Heading line. \s* (not \s+) is deliberate — Gemini sometimes emits
    // "###Heading" with no space after the hashes and we want to treat that
    // as a heading too, otherwise the whole line collapses into the prior
    // section's prose and the `###` break is lost.
    const headingMatch = line.match(/^(#{1,6})\s*(.+)$/);
    if (headingMatch) {
      flushSection();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      // Pop sibling/deeper levels off the stack; push this one
      headingStack = headingStack.filter((h) => h.level < level);
      headingStack.push({ level, text });
      pendingPage = currentPage;
      continue;
    }

    pendingContent.push(line);
  }
  flushSection();

  return sections;
}

// --- Section → chunks --------------------------------------------------------

async function materializeSection(section, { maxChunkSize, chunkOverlap }) {
  const base = {
    breadcrumb: section.breadcrumb,
    breadcrumbParts: section.breadcrumbParts,
    page: section.page,
    chunkType: section.chunkType,
    scope: section.scope,
    variantName: section.variantName,
  };

  // Never split tables, legends — they must stay whole for the downstream model.
  const keepWhole = section.chunkType === "table" || section.chunkType === "legend";
  if (keepWhole || section.content.length <= maxChunkSize) {
    return [{ ...base, text: prependBreadcrumb(section.breadcrumb, section.content) }];
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: maxChunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });
  const parts = await splitter.splitText(section.content);
  return parts.map((part) => ({
    ...base,
    text: prependBreadcrumb(section.breadcrumb, part),
  }));
}

function prependBreadcrumb(breadcrumb, content) {
  if (!breadcrumb) return content;
  return `**${breadcrumb}**\n\n${content}`;
}

// --- Chunk-type classification -----------------------------------------------

function detectChunkType(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "text";

  const tableLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (tableLines.length >= 3 && tableLines.length / lines.length > 0.6) {
    return "table";
  }

  const listLines = lines.filter((l) => /^([-*•]|\d+\.)\s/.test(l));
  if (listLines.length / lines.length > 0.6 && listLines.length >= 2) {
    return "list";
  }

  return "text";
}

// --- Auto-flags --------------------------------------------------------------

function applyFlags(chunks) {
  return chunks.map((chunk) => {
    const flags = [];
    const len = chunk.text.length;

    if (len < FLAG_THRESHOLDS.tooShort) flags.push("too-short");
    if (len > FLAG_THRESHOLDS.tooLong) flags.push("too-long");
    if (!chunk.breadcrumb) flags.push("no-breadcrumb");

    const isGibberish =
      junkCharRatio(chunk.text) > FLAG_THRESHOLDS.maxJunkRatio ||
      (len > FLAG_THRESHOLDS.longChunkThresholdForWordRun &&
        longestAlphaRun(chunk.text) < FLAG_THRESHOLDS.minWordRunLengthForLongChunk);
    if (isGibberish) flags.push("gibberish");

    if (chunk.chunkType === "table" && countTableRows(chunk.text) < FLAG_THRESHOLDS.minTableRows) {
      flags.push("table-fragment");
    }

    return { ...chunk, flags };
  });
}

// Fraction of characters that don't match anything we'd expect in rulebook
// text. Used as a "is this PDF-extraction garbage?" heuristic. Stays close to
// 0 for normal prose, component lists, and markdown tables. Climbs only when
// the text is full of mojibake / control characters / unparseable symbols.
function junkCharRatio(text) {
  if (!text) return 0;
  let junk = 0;
  for (let i = 0; i < text.length; i++) {
    if (!VALID_CHAR_RE.test(text[i])) junk++;
  }
  return junk / text.length;
}

function countTableRows(text) {
  return text.split("\n").filter((l) => l.trim().startsWith("|")).length;
}

// Length of the longest consecutive run of alphabetic characters in the text.
// Real English prose always contains several 4+ letter runs ("game", "cards",
// "place", etc.). Image-OCR noise is often dominated by 1–3 letter fragments
// ("VP 3 ATK 2 def..."), so a long chunk with no 4+ letter run is suspicious.
function longestAlphaRun(text) {
  let best = 0;
  let cur = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const isAlpha =
      (c >= 65 && c <= 90) || // A-Z
      (c >= 97 && c <= 122) || // a-z
      c > 127; // any non-ASCII letter-ish char (covers accented letters)
    if (isAlpha) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}
