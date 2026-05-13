import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import mongoose from "mongoose";
import { MdGroups, MdOutlineAccessTimeFilled, MdMenuBook, MdOpenInNew } from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { ImBubbles } from "react-icons/im";
import ExpandableText from "@/components/ExpandableText";
import StatBadge from "@/components/boardgame/StatBadge";
import { InfoSection, ChipList } from "@/components/ui";
import { siteUrl } from "@/utils/siteUrl";
import { minutesToISO8601 } from "@/utils/iso-duration";
import { loadExpansion } from "@/lib/server/boardgame-loader";

const getExpansion = loadExpansion;

export async function generateMetadata({ params }) {
  const { id, exp_id } = await params;
  const expansion = await getExpansion(exp_id);

  if (!expansion) return { title: "Expansion | Meepletron" };

  const { title, description, image, year, min_players, max_players, play_time, slug, parent_id, designers } = expansion;
  const parentSlug = parent_id?.slug || parent_id?._id || id;
  const expSlug = slug || exp_id;

  const playerRange =
    min_players && max_players
      ? min_players === max_players ? `${min_players} players` : `${min_players}–${max_players} players`
      : null;
  const snippetPrefix = [playerRange, play_time ? `${play_time} min` : null, year]
    .filter(Boolean)
    .join(" · ");
  const baseDesc = description?.replace(/\s+/g, " ").trim() ?? "";
  const description160 = snippetPrefix
    ? `${snippetPrefix}. ${baseDesc}`.slice(0, 158)
    : baseDesc.slice(0, 158);

  const keywords = [
    title,
    `${title} expansion`,
    `${title} rules`,
    `how to play ${title}`,
    ...(parent_id?.title ? [`${parent_id.title} ${title}`, `${parent_id.title} expansion`] : []),
    ...(designers || []).slice(0, 3).map((d) => `${title} ${d}`),
  ];

  return {
    title: `${title} — Expansion Rules & How to Play`,
    description: description160,
    keywords,
    alternates: { canonical: `/boardgames/${parentSlug}/expansions/${expSlug}` },
    openGraph: {
      title: `${title} | Meepletron`,
      description: description160,
      url: `/boardgames/${parentSlug}/expansions/${expSlug}`,
      type: "article",
      images: image ? [{ url: image, alt: `${title} cover image` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Expansion Rules`,
      description: description160,
      images: image ? [image] : undefined,
    },
  };
}

function buildJsonLd(expansion, parentSlug, expSlug) {
  const {
    title, description, image, year, designers, publishers,
    min_players, max_players, min_age, play_time, categories, game_mechanics, bgg_id,
    parent_id, createdAt, updatedAt,
  } = expansion;

  const sameAs = bgg_id ? [`https://boardgamegeek.com/boardgame/${bgg_id}`] : undefined;

  const game = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: title,
    description,
    image,
    url: `${siteUrl}/boardgames/${parentSlug}/expansions/${expSlug}`,
    ...(year && { datePublished: String(year) }),
    ...(designers?.length && { author: designers.map((d) => ({ "@type": "Person", name: d })) }),
    ...(publishers?.length && { publisher: publishers.map((p) => ({ "@type": "Organization", name: p })) }),
    ...(min_players && max_players && {
      numberOfPlayers: { "@type": "QuantitativeValue", minValue: min_players, maxValue: max_players },
    }),
    ...(play_time && { playTime: minutesToISO8601(play_time) }),
    ...(min_age && { typicalAgeRange: `${min_age}+` }),
    ...(categories?.length && { genre: categories }),
    ...(game_mechanics?.length && { gamePlatform: game_mechanics }),
    ...(sameAs && { sameAs }),
    ...(parent_id && { isPartOf: { "@type": "Game", name: parent_id.title, url: `${siteUrl}/boardgames/${parentSlug}` } }),
    ...(createdAt && { dateCreated: createdAt }),
    ...(updatedAt && { dateModified: updatedAt }),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Board Games", item: `${siteUrl}/boardgames` },
      ...(parent_id ? [{ "@type": "ListItem", position: 3, name: parent_id.title, item: `${siteUrl}/boardgames/${parentSlug}` }] : []),
      { "@type": "ListItem", position: parent_id ? 4 : 3, name: title, item: `${siteUrl}/boardgames/${parentSlug}/expansions/${expSlug}` },
    ],
  };

  return [game, breadcrumb];
}

export default async function ExpansionPage({ params }) {
  const { id, exp_id } = await params;
  const expansion = await getExpansion(exp_id);
  if (!expansion) notFound();

  const parentSlug = expansion.parent_id?.slug || expansion.parent_id?._id;
  const expSlug = expansion.slug || expansion._id;

  // 308-redirect to canonical slug URL if either segment came in as ObjectId
  const parentIsObjId = mongoose.isValidObjectId(id);
  const expIsObjId = mongoose.isValidObjectId(exp_id);
  const wantsRedirect =
    (parentIsObjId && expansion.parent_id?.slug && id !== expansion.parent_id.slug) ||
    (expIsObjId && expansion.slug && exp_id !== expansion.slug);
  if (wantsRedirect) {
    permanentRedirect(`/boardgames/${parentSlug}/expansions/${expSlug}`);
  }

  const {
    title, year, thumbnail,
    min_players, max_players, min_age, play_time,
    designers, artists, publishers, categories, game_mechanics,
    description, urls, parent_id,
  } = expansion;

  const jsonLd = buildJsonLd(expansion, parentSlug, expSlug);

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      {jsonLd.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}

      <div className="max-w-5xl mx-auto">

        <nav className="flex items-center gap-1.5 text-sm text-muted mb-8 flex-wrap" aria-label="Breadcrumb">
          <Link href="/boardgames" className="hover:text-primary transition-colors">Board Games</Link>
          <span>/</span>
          <Link
            href={`/boardgames/${parentSlug}`}
            className="capitalize hover:text-primary transition-colors truncate max-w-[120px]">
            {parent_id?.title}
          </Link>
          <span>/</span>
          <span className="capitalize text-foreground font-medium truncate max-w-[160px]">{title}</span>
        </nav>

        <div className="flex flex-col sm:flex-row gap-8 mb-12">
          <div className="w-48 shrink-0 mx-auto sm:mx-0">
            <img src={thumbnail} alt={title} className="w-full rounded-2xl shadow-lg object-cover aspect-square" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Expansion</p>
            <div className="flex flex-wrap items-center justify-start gap-3 mb-1">
              <h1 className="text-3xl font-bold text-foreground capitalize leading-tight">{title}</h1>
              {year && (
                <span className="shrink-0 text-sm font-medium text-muted bg-surface px-3 py-1 rounded-full border border-border">
                  {year}
                </span>
              )}
            </div>

            {designers?.length > 0 && (
              <p className="text-sm text-muted mb-5">by {designers.join(", ")}</p>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <StatBadge icon={<MdGroups size={18} />} value={`${min_players}–${max_players}`} label="Players" />
              <StatBadge icon={<MdOutlineAccessTimeFilled size={18} />} value={`${play_time} min`} label="Play Time" />
              <StatBadge icon={<FaChild size={16} />} value={`${min_age}+`} label="Min Age" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/boardgames/${parentSlug}/chat`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover transition-colors shadow-sm">
                <ImBubbles size={16} />
                Chat about rules
              </Link>
              {urls?.length > 0 && (
                <a
                  href={urls[0].path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-muted font-semibold text-sm hover:bg-surface-muted transition-colors">
                  <MdMenuBook size={16} />
                  Rulebook
                </a>
              )}
            </div>
          </div>
        </div>

        {description && (
          <InfoSection title="About">
            <ExpandableText text={description} className="text-muted" />
          </InfoSection>
        )}

        {(categories?.length > 0 || game_mechanics?.length > 0 || artists?.length > 0 || publishers?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mb-2">
            {categories?.length > 0 && <InfoSection title="Categories"><ChipList items={categories} /></InfoSection>}
            {game_mechanics?.length > 0 && <InfoSection title="Mechanics"><ChipList items={game_mechanics} /></InfoSection>}
            {artists?.length > 0 && (
              <InfoSection title="Artists">
                <p className="text-sm text-muted">{artists.join(", ")}</p>
              </InfoSection>
            )}
            {publishers?.length > 0 && (
              <InfoSection title="Publishers">
                <p className="text-sm text-muted">{publishers.join(", ")}</p>
              </InfoSection>
            )}
          </div>
        )}

        {urls?.length > 0 && (
          <InfoSection title="Files">
            <ul className="space-y-2">
              {urls.map((url, i) => (
                <li key={i}>
                  <a
                    href={url.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-2 transition-colors">
                    <MdMenuBook size={15} />
                    {url.path.split("/").pop()}
                    <MdOpenInNew size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </InfoSection>
        )}

        {parent_id && (
          <InfoSection title="Base Game">
            <Link href={`/boardgames/${parentSlug}`} className="inline-flex items-center gap-3 group">
              <img
                src={parent_id.thumbnail}
                alt={parent_id.title}
                className="w-14 h-14 rounded-xl object-cover shadow-sm"
              />
              <div>
                <p className="capitalize font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {parent_id.title}
                </p>
                {parent_id.year && <p className="text-xs text-subtle">{parent_id.year}</p>}
              </div>
            </Link>
          </InfoSection>
        )}
      </div>
    </main>
  );
}
