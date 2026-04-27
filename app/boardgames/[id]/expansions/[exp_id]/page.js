import Link from "next/link";
import { notFound } from "next/navigation";
import { MdGroups, MdOutlineAccessTimeFilled, MdMenuBook, MdOpenInNew } from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { ImBubbles } from "react-icons/im";

const dev = "http://localhost:3000";
const prod = "https://www.meepletron.com";

async function getExpansion(id) {
  try {
    const res = await fetch(
      `${process.env.NODE_ENV !== "production" ? dev : prod}/api/expansions/${id}`,
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
    title,
    year,
    thumbnail,
    min_players,
    max_players,
    min_age,
    play_time,
    designers,
    artists,
    publishers,
    categories,
    game_mechanics,
    description,
    urls,
    parent_id,
  } = expansion;

  const parentSlug = parent_id?.slug || parent_id?._id;

  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 mb-8 flex-wrap">
          <Link
            href="/boardgames"
            className="hover:text-blue-600 dark:hover:text-yellow-400 transition-colors">
            Board Games
          </Link>
          <span>/</span>
          <Link
            href={`/boardgames/${parentSlug}`}
            className="capitalize hover:text-blue-600 dark:hover:text-yellow-400 transition-colors truncate max-w-[120px]">
            {parent_id?.title}
          </Link>
          <span>/</span>
          <span className="capitalize text-gray-800 dark:text-slate-300 font-medium truncate max-w-[160px]">
            {title}
          </span>
        </nav>

        {/* Hero */}
        <div className="flex flex-col sm:flex-row gap-8 mb-12">
          <div className="w-48 shrink-0 mx-auto sm:mx-0">
            <img
              src={thumbnail}
              alt={title}
              className="w-full rounded-2xl shadow-lg object-cover aspect-square"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-blue-600 dark:text-yellow-500 font-semibold mb-1">
              Expansion
            </p>
            <div className="flex flex-wrap items-center justify-start gap-3 mb-1">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize leading-tight">
                  {title}
                </h1>
              </div>
              {year && (
                <span className="shrink-0 text-sm font-medium text-gray-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-700">
                  {year}
                </span>
              )}
            </div>

            {designers?.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                by {designers.join(", ")}
              </p>
            )}

            {/* Stats */}
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

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/boardgames/${parentSlug}/chat`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 dark:bg-yellow-500 text-white dark:text-slate-900 font-semibold text-sm hover:bg-blue-700 dark:hover:bg-yellow-400 transition-colors shadow-sm">
                <ImBubbles size={16} />
                Chat about rules
              </Link>
              {urls?.length > 0 && (
                <a
                  href={urls[0].path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-gray-700 dark:text-slate-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <MdMenuBook size={16} />
                  Rulebook
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <InfoSection title="About">
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </InfoSection>
        )}

        {/* Info grid */}
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
                <p className="text-sm text-gray-700 dark:text-slate-300">{artists.join(", ")}</p>
              </InfoSection>
            )}
            {publishers?.length > 0 && (
              <InfoSection title="Publishers">
                <p className="text-sm text-gray-700 dark:text-slate-300">{publishers.join(", ")}</p>
              </InfoSection>
            )}
          </div>
        )}

        {/* All rulebook files */}
        {urls?.length > 1 && (
          <InfoSection title="Files">
            <ul className="space-y-2">
              {urls.map((url, i) => (
                <li key={i}>
                  <a
                    href={url.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-yellow-400 hover:underline underline-offset-2">
                    <MdMenuBook size={15} />
                    {url.path.split("https://meepletron-storage.s3.us-east-2.amazonaws.com/resources/")[1]}
                    <MdOpenInNew size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </InfoSection>
        )}

        {/* Parent game */}
        {parent_id && (
          <InfoSection title="Base Game">
            <Link
              href={`/boardgames/${parentSlug}`}
              className="inline-flex items-center gap-3 group">
              <img
                src={parent_id.thumbnail}
                alt={parent_id.title}
                className="w-14 h-14 rounded-xl object-cover shadow-sm"
              />
              <div>
                <p className="capitalize font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
                  {parent_id.title}
                </p>
                {parent_id.year && (
                  <p className="text-xs text-gray-400 dark:text-slate-500">{parent_id.year}</p>
                )}
              </div>
            </Link>
          </InfoSection>
        )}
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/70 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm backdrop-blur-sm">
      <span className="text-blue-600 dark:text-yellow-500">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
}

function InfoSection({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-semibold uppercase tracking-widest text-gray-500 dark:text-slate-400 mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ChipList({ items }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-700/80 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600">
          {item}
        </span>
      ))}
    </div>
  );
}
