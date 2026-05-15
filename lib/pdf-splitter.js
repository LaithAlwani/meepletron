// Slice a PDF into smaller page-range buffers so each piece fits within
// Gemini's 20 MB inline cap and a single Vercel function's 60s budget.
//
// Pure functions on Buffers — no I/O, easy to test. Uses pdf-lib, which is
// pure-JS and runs fine on Vercel without any native dependencies.

import { PDFDocument } from "pdf-lib";

// Fixed page budget per batch. Many rulebooks are small (~2 MB) but long
// (60+ pages), and Gemini's processing time scales with page count more than
// with byte size. 5 pages per batch keeps every Gemini call comfortably
// inside the Hobby plan's 60 s function ceiling.
const DEFAULT_PAGES_PER_BATCH = 5;

/**
 * Load a PDF and report its page count + byte size.
 *
 * @param {Buffer} buffer
 * @returns {Promise<{ totalPages: number, totalBytes: number }>}
 */
export async function getPdfMeta(buffer) {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return {
    totalPages: doc.getPageCount(),
    totalBytes: buffer.length,
  };
}

/**
 * Extract a contiguous page range as a fresh, self-contained PDF.
 *
 * @param {Buffer} buffer
 * @param {number} startPage  1-indexed inclusive
 * @param {number} endPage    1-indexed inclusive
 * @returns {Promise<Buffer>}
 */
export async function extractPageRange(buffer, startPage, endPage) {
  if (startPage < 1) throw new Error(`startPage must be >= 1 (got ${startPage})`);
  if (endPage < startPage) throw new Error(`endPage (${endPage}) < startPage (${startPage})`);

  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = src.getPageCount();
  if (endPage > total) {
    throw new Error(`endPage (${endPage}) exceeds total page count (${total})`);
  }

  const out = await PDFDocument.create();
  const pageIndices = [];
  for (let i = startPage - 1; i <= endPage - 1; i++) pageIndices.push(i);
  const copied = await out.copyPages(src, pageIndices);
  for (const p of copied) out.addPage(p);

  const bytes = await out.save();
  return Buffer.from(bytes);
}

/**
 * Plan batch boundaries with a fixed page count per batch. Returns an ordered
 * list of `{ index, startPage, endPage }` covering every page exactly once.
 * Same inputs produce the same plan — used by both the first parse call and
 * any resume call to map a `cursor` back to a batch.
 *
 * @param {object} args
 * @param {number} args.totalPages
 * @param {number} [args.pagesPerBatch=5]
 * @returns {Array<{ index: number, startPage: number, endPage: number }>}
 */
export function planBatches({ totalPages, pagesPerBatch = DEFAULT_PAGES_PER_BATCH }) {
  if (totalPages < 1) return [];
  const step = Math.max(1, Math.min(pagesPerBatch, totalPages));

  const batches = [];
  let index = 0;
  for (let start = 1; start <= totalPages; start += step) {
    const end = Math.min(start + step - 1, totalPages);
    batches.push({ index, startPage: start, endPage: end });
    index += 1;
  }
  return batches;
}
