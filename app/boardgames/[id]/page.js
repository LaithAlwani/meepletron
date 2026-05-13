import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import mongoose from "mongoose";
import { MdGroups, MdOutlineAccessTimeFilled, MdMenuBook, MdOpenInNew } from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { ImBubbles } from "react-icons/im";
import { GiCardboardBox } from "react-icons/gi";
import ExpandableText from "@/components/ExpandableText";
import StatBadge from "@/components/boardgame/StatBadge";
import { InfoSection, ChipList } from "@/components/ui";
import { siteUrl } from "@/utils/siteUrl";
import { minutesToISO8601 } from "@/utils/iso-duration";
import { loadBoardgame } from "@/lib/server/boardgame-loader";

const getBoardgame = loadBoardgame;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const boardgame = await getBoardgame(id);

  if (!boardgame) {
    return { title: "Board Game | Meepletron" };
  }

  const { title, description, image, year, min_players, max_players, play_time, slug, designers } = boardgame;
  const slugOrId = slug || id;

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
    `${title} rules`,
    `how to play ${title}`,
    `${title} setup`,
    `${title} board game`,
    ...(designers || []).slice(0, 3).map((d) => `${title} ${d}`),
  ];

  return {
    title: `${title} — Rules, How to Play, Setup`,
    description: description160,
    keywords,
    alternates: { canonical: `/boardgames/${slugOrId}` },
    openGraph: {
      title: `${title} | Meepletron`,
      description: description160,
      url: `/boardgames/${slugOrId}`,
      type: "article",
      images: image ? [{ url: image, alt: `${title} cover image` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Rules & How to Play`,
      description: description160,
      images: image ? [image] : undefined,
    },
  };
}

function buildJsonLd(boardgame, slugOrId) {
  const {
    title, description, image, year, designers, publishers,
    min_players, max_players, min_age, play_time, categories, game_mechanics, bgg_id,
    createdAt, updatedAt,
  } = boardgame;

  const sameAs = bgg_id
    ? [`https://boardgamegeek.com/boardgame/${bgg_id}`]
    : undefined;

  const game = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: title,
    description,
    image,
    url: `${siteUrl}/boardgames/${slugOrId}`,
    ...(year && { datePublished: String(year) }),
    ...(designers?.length && {
      author: designers.map((d) => ({ "@type": "Person", name: d })),
    }),
    ...(publishers?.length && {
      publisher: publishers.map((p) => ({ "@type": "Organization", name: p })),
    }),
    ...(min_players && max_players && {
      numberOfPlayers: {
        "@type": "QuantitativeValue",
        minValue: min_players,
        maxValue: max_players,
      },
    }),
    ...(play_time && { playTime: minutesToISO8601(play_time) }),
    ...(min_age && { typicalAgeRange: `${min_age}+` }),
    ...(categories?.length && { genre: categories }),
    ...(game_mechanics?.length && { gamePlatform: game_mechanics }),
    ...(sameAs && { sameAs }),
    ...(createdAt && { dateCreated: createdAt }),
    ...(updatedAt && { dateModified: updatedAt }),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Board Games", item: `${siteUrl}/boardgames` },
      { "@type": "ListItem", position: 3, name: title, item: `${siteUrl}/boardgames/${slugOrId}` },
    ],
  };

  const faqEntries = [];
  if (min_players && max_players) {
    faqEntries.push({
      "@type": "Question",
      name: `How many players can play ${title}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text:
          min_players === max_players
            ? `${title} is played with ${min_players} players.`
            : `${title} can be played with ${min_players} to ${max_players} players.`,
      },
    });
  }
  if (play_time) {
    faqEntries.push({
      "@type": "Question",
      name: `How long does a game of ${title} take?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `A typical game of ${title} takes about ${play_time} minutes.`,
      },
    });
  }
  if (min_age) {
    faqEntries.push({
      "@type": "Question",
      name: `What age is ${title} for?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${title} is recommended for ages ${min_age} and up.`,
      },
    });
  }
  if (designers?.length) {
    faqEntries.push({
      "@type": "Question",
      name: `Who designed ${title}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${title} was designed by ${designers.join(", ")}.`,
      },
    });
  }
  if (publishers?.length) {
    faqEntries.push({
      "@type": "Question",
      name: `Who publishes ${title}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${title} is published by ${publishers.join(", ")}.`,
      },
    });
  }

  const faq = faqEntries.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntries,
      }
    : null;

  return [game, breadcrumb, faq].filter(Boolean);
}

export default async function BoardgamePage({ params }) {
  const { id } = await params;
  const boardgame = await getBoardgame(id);
  if (!boardgame) notFound();

  // If the URL is an ObjectId and we have a slug, 308-redirect to the slug URL.
  if (boardgame.slug && mongoose.isValidObjectId(id) && id !== boardgame.slug) {
    permanentRedirect(`/boardgames/${boardgame.slug}`);
  }

  const {
    _id, slug,
    title, year, thumbnail,
    min_players, max_players, min_age, play_time,
    designers, artists, publishers, categories, game_mechanics,
    description, urls, expansions,
  } = boardgame;

  const slugOrId = slug || _id;
  const jsonLd = buildJsonLd(boardgame, slugOrId);

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
        <nav className="flex items-center gap-1.5 text-sm text-muted mb-8" aria-label="Breadcrumb">
          <Link href="/boardgames" className="hover:text-primary transition-colors">
            Board Games
          </Link>
          <span>/</span>
          <span className="capitalize text-foreground font-medium truncate max-w-[200px]">
            {title}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row gap-8 mb-12">
          <div className="w-48 shrink-0 mx-auto sm:mx-0">
            <img
              src={thumbnail}
              alt={title}
              className="w-full rounded-2xl shadow-lg object-cover aspect-square"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-start gap-3 mb-1">
              <h1 className="text-3xl font-bold text-foreground capitalize leading-tight">
                {title}
              </h1>
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
              <StatBadge
                icon={<MdGroups size={18} />}
                value={`${min_players}–${max_players}`}
                label="Players"
              />
              <StatBadge
                icon={<MdOutlineAccessTimeFilled size={18} />}
                value={`${play_time} min`}
                label="Play Time"
              />
              <StatBadge icon={<FaChild size={16} />} value={`${min_age}+`} label="Min Age" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/boardgames/${slugOrId}/chat`}
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
              <Link
                href={`/tuckbox?gameId=${slugOrId}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-muted font-semibold text-sm hover:bg-surface-muted transition-colors">
                <GiCardboardBox size={16} />
                Make a tuckbox
              </Link>
            </div>
          </div>
        </div>

        {description && (
          <InfoSection title="About">
            <ExpandableText text={description} className="text-muted" />
          </InfoSection>
        )}

        {(categories?.length > 0 ||
          game_mechanics?.length > 0 ||
          artists?.length > 0 ||
          publishers?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mb-2">
            {categories?.length > 0 && (
              <InfoSection title="Categories">
                <ChipList items={categories} />
              </InfoSection>
            )}
            {game_mechanics?.length > 0 && (
              <InfoSection title="Mechanics">
                <ChipList items={game_mechanics} />
              </InfoSection>
            )}
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

        {expansions?.length > 0 && (
          <InfoSection title={`Expansions (${expansions.length})`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {expansions.map((exp) => (
                <Link
                  key={exp._id}
                  href={`/boardgames/${slugOrId}/expansions/${exp.slug || exp._id}`}
                  className="group flex flex-col">
                  <div className="aspect-square overflow-hidden rounded-xl shadow-sm">
                    <img
                      src={exp.thumbnail}
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-foreground capitalize truncate px-0.5 leading-tight">
                    {exp.title}
                  </p>
                  {exp.year && <p className="text-[10px] text-subtle px-0.5">{exp.year}</p>}
                </Link>
              ))}
            </div>
          </InfoSection>
        )}
      </div>
    </main>
  );
}
