import Link from "next/link";

export default function BoardgameContainer({ boardgame }) {
  const { _id, slug, thumbnail, title } = boardgame;
  const href = `/boardgames/${slug || _id}`;

  return (
    <div className="group relative flex flex-col">
      <Link href={href} aria-label={title} className="block relative aspect-square overflow-hidden rounded-xl shadow-sm">
        <img
          src={thumbnail}
          alt={`${title} board game`}
          title={`${title} board game`}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <p className="mt-1.5 text-xs font-medium text-foreground capitalize truncate leading-tight px-0.5">
        {title}
      </p>
    </div>
  );
}
