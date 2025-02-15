import Link from "next/link";
import Image from "next/image";
import { BsChatDots } from "react-icons/bs";
import FavoriteButton from "./FavoriteButton";

export default function BoardgameContainer({ boardgame }) {
  const { _id, image, title, parent_id } = boardgame;
  return (
    <div className="relative">
      <Link href={`/boardgames/${_id}`} className="block w-[11rem] h-[11rem]" aria-label={`${boardgame.title}`}>
        <Image
          src={image}
          alt={title}
          className="w-full h-full rounded-md object-cover object-top"
          fill
          sizes={"25vw"}
          quality={10}
        />
      </Link>
      {/* <span className="absolute bottom-1 left-1">
        <FavoriteButton />
      </span> */}
      <Link
        href={`/boardgames/${parent_id || _id}/chat`}
        aria-label={`${boardgame.title} chat`}
        className="absolute bottom-1 right-1 text-white bg-blue-600 dark:bg-yellow-500 dark:text-slate-900 rounded-full p-2">
        <BsChatDots size={22} />
      </Link>
    </div>
  );
}
