import Link from "next/link";

export default function BoardgameContainer({ boardgame }) {
  const { _id, thumbnail, title } = boardgame;

  return (
    <div className="group relative flex flex-col">
      {/* Thumbnail */}
      <Link href={`/boardgames/${_id}`} aria-label={title} className="block relative aspect-square overflow-hidden rounded-xl shadow-sm">
        <img
          src={thumbnail}
          alt={`${title} board game`}
          title={`${title} board game`}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Title */}
      <p className="mt-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 capitalize truncate leading-tight px-0.5">
        {title}
      </p>
    </div>
  );
}
