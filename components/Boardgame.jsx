import Link from "next/link";
import Image from "next/image";
import { BsChatDots } from "react-icons/bs";

export default function Boardgame({ boardgame }) {
  const {_id, image, title} = boardgame
  return (
    <div className="relative">
      <Link href={`/boardgames/${_id}`} className="block w-[11rem] h-[11rem]">
        <Image
          src={image}
          alt={title}
          className="w-full h-full rounded-md object-cover object-top"
          fill
          sizes={"25vw"}
          quality={10}
        />
      </Link>
      <Link
        href={`/chat/${_id}`}
        className="absolute bottom-1 right-1 text-white bg-indigo-600 dark:bg-yellow-500 dark:text-slate-900 rounded-full p-2">
        <BsChatDots size={22} />
      </Link>
    </div>
  );
}
