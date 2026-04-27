import Link from "next/link";
import { notFound } from "next/navigation";
import { MdGroups, MdOutlineAccessTimeFilled, MdMenuBook, MdOpenInNew } from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { ImBubbles } from "react-icons/im";
import ExpandableText from "@/components/ExpandableText";
import StatBadge from "@/components/boardgame/StatBadge";
import { InfoSection, ChipList } from "@/components/ui";
import { siteUrl } from "@/utils/siteUrl";

async function getBoardgame(id) {
  try {
    const res = await fetch(
      `${siteUrl}/api/boardgames/${id}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const boardgame = await getBoardgame(id);
  return {
    title: boardgame ? `${boardgame.title} | Meepletron` : "Board Game | Meepletron",
    description: boardgame?.description?.slice(0, 160),
    alternates: { canonical: `/boardgames/${id}` },
    openGraph: { images: [boardgame?.image] },
  };
}

export default async function BoardgamePage({ params }) {
  const { id } = await params;
  const boardgame = await getBoardgame(id);
  if (!boardgame) notFound();

  const {
    _id, title, year, thumbnail,
    min_players, max_players, min_age, play_time,
    designers, artists, publishers, categories, game_mechanics,
    description, urls, expansions,
  } = boardgame;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        <nav className="flex items-center gap-1.5 text-sm text-muted mb-8">
          <Link href="/boardgames" className="hover:text-primary transition-colors">Board Games</Link>
          <span>/</span>
          <span className="capitalize text-foreground font-medium truncate max-w-[200px]">{title}</span>
        </nav>

        <div className="flex flex-col sm:flex-row gap-8 mb-12">
          <div className="w-48 shrink-0 mx-auto sm:mx-0">
            <img src={thumbnail} alt={title} className="w-full rounded-2xl shadow-lg object-cover aspect-square" />
          </div>

          <div className="flex-1 min-w-0">
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
                href={`/boardgames/${_id}/chat`}
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

        {urls?.length > 1 && (
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
                    Rulebook {urls.length > 1 ? i + 1 : ""}
                    <MdOpenInNew size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </InfoSection>
        )}

        {expansions?.length > 0 && (
          <InfoSection title={`Expansions (${expansions.length})`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {expansions.map((exp) => (
                <Link key={exp._id} href={`/boardgames/${_id}/expansions/${exp._id}`} className="group flex flex-col">
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
