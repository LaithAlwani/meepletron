import he from "he";
import { NextResponse } from "next/server";

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : null;
}

function extractAttr(xml, pattern, attr) {
  const m = xml.match(new RegExp(`${pattern}[^>]*\\s${attr}="([^"]+)"`));
  return m ? m[1] : null;
}

function extractLinks(xml, type) {
  const re = new RegExp(`<link[^>]+type="${type}"[^>]+value="([^"]+)"`, "g");
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function fixUrl(url) {
  if (!url) return url;
  return url.startsWith("//") ? `https:${url}` : url;
}

async function fetchBgg(id) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&type=boardgame,boardgameexpansion`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 202) return null; // queued — caller should retry
    if (!res.ok) throw new Error(`BGG returned ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Missing or invalid BGG id" }, { status: 400 });
  }

  let xml;
  try {
    xml = await fetchBgg(id);
    if (!xml) {
      await new Promise((r) => setTimeout(r, 2000));
      xml = await fetchBgg(id);
      if (!xml) {
        return NextResponse.json(
          { error: "BGG is processing this request — please try again in a few seconds" },
          { status: 503 }
        );
      }
    }
  } catch (err) {
    const msg = err.name === "AbortError" ? "Request to BGG timed out — please try again" : (err.message || "Failed to reach BGG");
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  try {
    const isExpansion = xml.includes(`type="boardgameexpansion"`);

    const title = extractAttr(xml, '<name', 'value') ?? "";
    const thumbnail = fixUrl(extractTag(xml, "thumbnail"));
    const image = fixUrl(extractTag(xml, "image"));
    const rawDescription = extractTag(xml, "description") ?? "";
    const description = he.decode(rawDescription).replace(/\r/g, "").trim();
    const year = extractAttr(xml, '<yearpublished', 'value') ?? "";
    const minPlayers = extractAttr(xml, '<minplayers', 'value') ?? "";
    const maxPlayers = extractAttr(xml, '<maxplayers', 'value') ?? "";
    const playTime = extractAttr(xml, '<playingtime', 'value') ?? "";
    const minAge = extractAttr(xml, '<minage', 'value') ?? "";

    const designers = extractLinks(xml, "boardgamedesigner").filter((d) => d !== "(Uncredited)");
    const artists = extractLinks(xml, "boardgameartist").filter((a) => a !== "(Uncredited)");
    const publishers = extractLinks(xml, "boardgamepublisher").filter((p) => p !== "(Web published)");
    const categories = extractLinks(xml, "boardgamecategory");
    const gameMechanics = extractLinks(xml, "boardgamemechanic");

    let parentBggId = null;
    if (isExpansion) {
      const m1 = xml.match(/<link[^>]+type="boardgameexpansion"[^>]+inbound="true"[^>]+id="(\d+)"/);
      const m2 = xml.match(/<link[^>]+inbound="true"[^>]+type="boardgameexpansion"[^>]+id="(\d+)"/);
      parentBggId = (m1 ?? m2)?.[1] ?? null;
    }

    return NextResponse.json({
      title, thumbnail, image, description,
      year: year ? Number(year) : null,
      min_players: minPlayers ? Number(minPlayers) : null,
      max_players: maxPlayers ? Number(maxPlayers) : null,
      play_time: playTime ? Number(playTime) : null,
      min_age: minAge ? Number(minAge) : null,
      designers, artists, publishers, categories,
      game_mechanics: gameMechanics,
      bgg_id: id,
      is_expansion: isExpansion,
      parent_bgg_id: parentBggId,
    });
  } catch (err) {
    console.error("[bgg-fetch] parse error:", err);
    return NextResponse.json({ error: "Failed to parse BGG response" }, { status: 500 });
  }
}
