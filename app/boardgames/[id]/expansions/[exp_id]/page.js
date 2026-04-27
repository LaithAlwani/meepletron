import Link from "next/link";
import { notFound } from "next/navigation";
import { MdGroups, MdOutlineAccessTimeFilled, MdMenuBook, MdOpenInNew } from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { ImBubbles } from "react-icons/im";
import ExpandableText from "@/components/ExpandableText";
import StatBadge from "@/components/boardgame/StatBadge";
import { InfoSection, ChipList } from "@/components/ui";
import { siteUrl } from "@/utils/siteUrl";

async function getExpansion(id) {
  try {
    const res = await fetch(
      `${siteUrl}/api/expansions/${id}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { exp_id } = await params;
  const expansion = await getExpansion(exp_id);
  return {
    title: expansion ? `${expansion.title} | Meepletron` : "Expansion | Meepletron",
    description: expansion?.description?.slice(0, 160),
    openGraph: { images: [expansion?.image] },
  };
}

export default async function ExpansionPage({ params }) {
  const { exp_id } = await params;
  const expansion = await getExpansion(exp_id);
  if (!expansion) notFound();

  const {
    title, year, thumbnail,
    min_players, max_players, min_age, play_time,
    designers, artists, publishers, categories, game_mechanics,
    description, urls, parent_id,
  } = expansion;

  const parentSlug = parent_id?.slug || parent_id?._id;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        <nav className="flex items-center gap-1.5 text-sm text-muted mb-8 flex-wrap">
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
