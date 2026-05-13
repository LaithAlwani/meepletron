// Same-origin image proxy. The tuckbox designer needs to fetch game artwork from
// the S3 bucket as a Blob (to convert to a data URL for the PDF generator). S3
// CORS has been flaky to configure, so we proxy the image through this route —
// the client sees a same-origin URL and never trips a CORS check.
//
// Hostname is allow-listed to prevent SSRF.

import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "meepletron-storage.s3.us-east-2.amazonaws.com",
]);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ message: "Missing url" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ message: "Invalid url" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ message: "Forbidden host" }, { status: 403 });
  }

  let upstream;
  try {
    upstream = await fetch(target, { next: { revalidate: 86400 } });
  } catch (err) {
    console.error("[image-proxy] fetch failed:", err);
    return NextResponse.json({ message: "Upstream fetch failed" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { message: `Upstream ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const body = await upstream.arrayBuffer();
  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
