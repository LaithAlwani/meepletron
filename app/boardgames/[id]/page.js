import Loader from "@/components/Loader";
import Image from "next/image";
import Link from "next/link";
import { MdGroups, MdOutlineAccessTimeFilled, MdMenuBook } from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { ImBubbles } from "react-icons/im";

const dev = "http://localhost:3000"
const prod = "https://www.meepletron.com"

async function getBoardgame(id) {
  try {
    const res = await fetch(`${process.env.NODE_ENV != "production" ? dev:prod}/api/boardgames/${id}`, {
      next:{revalidate:86400}, // Ensure fresh data
    });
    
    if (!res.ok) {
      const {message} = await res.json()
      throw new Error(message);
    }
    
    const { data } = await res.json();
    return {
      boardgame: data.boardgame || data,
      expansions: data.expansions || [],
    };
  } catch (error) {
    return { boardgame: null, expansions: [] };
  }
}

export default async function BoardgamePage({ params }) {
  const {id} = await params;
  const { boardgame, expansions } = await getBoardgame(id);

  if (!boardgame) {
    return (
      <div className="pt-[6rem]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-2 pt-[6rem]">
      <div className="flex flex-col justify-start gap-4 items-center">
        <div className="relative min-w-64 max-w-84 h-64">
          <Image
            src={boardgame.thumbnail}
            alt={`${boardgame.title} board game`}
            title={`${boardgame.title} board game`}
            className="w-full h-full rounded-md object-contain object-center"
            fill
            quality={100}
          />
        </div>
        <hgroup>
          <span className="text-xs px-4 font-semibold tracking-[1px]">{boardgame.designers[0]}</span>
          <h1 className="text-lg sm:text-2xl px-4 font-extrabold text-blue-600 dark:text-yellow-500 uppercase drop-shadow-xl mb-6">
            {boardgame.title} <span className="text-xs">({boardgame.year})</span>
          </h1>
        </hgroup>
        <div className="w-[256px] mx-auto flex justify-between items-start">
          <p className="flex flex-col justify-start items-center gap-2">
            <MdGroups size={24} />
            <span className="font-medium">
              {boardgame.min_players} - {boardgame.max_players}
            </span>
          </p>
          <p className="flex flex-col justify-start items-center gap-2">
            <MdOutlineAccessTimeFilled size={24} />
            <span className="font-medium">{boardgame.play_time}</span>
          </p>
          <p className="flex flex-col justify-start items-center gap-2">
            <FaChild size={24} />
            <span className="font-medium">{boardgame.min_age}+</span>
          </p>
          {boardgame.urls.length > 0 && (
            <a target="_blank" href={`${boardgame.urls[0].path}`} className="flex flex-col justify-start items-center gap-2 capitalize">
              <MdMenuBook size={24} />
              <span className="font-medium">Rules</span>
            </a>
          )}
          <Link className="flex flex-col justify-start items-center gap-2" href={`/boardgames/${boardgame.is_expansion ? boardgame.parent_id._id : boardgame._id}/chat`}>
            <ImBubbles size={24} />
            <span className="font-medium">Chat</span>
          </Link>
        </div>
      </div>

      {/* Expansions Section */}
      {expansions.length > 0 && (
        <div>
          <div className="relative flex py-5 items-center">
            <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
            <h2 className="px-4 text-2xl font-bold italic dark:text-yellow-500">Expansions</h2>
            <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
          </div>
          <ul className="list-disc">
            {expansions.map((exp) => (
              <li key={exp._id} className="flex justify-start items-end gap-2 mb-2">
                <div className="relative w-16 h-16">
                  <Image src={exp.thumbnail} alt={exp.title} fill className="rounded object-contain" />
                </div>
                <Link href={`/boardgames/${exp._id}`}>
                  <h3 className="capitalize font-semibold">
                    {exp.title} <span className="text-xs">({exp.year})</span>
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Parent Game Section */}
      {boardgame.parent_id && (
        <>
          <div className="relative flex py-5 items-center">
            <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
            <h2 className="px-4 text-2xl font-bold italic dark:text-yellow-500">Parent Game</h2>
            <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
          </div>
          <Link href={`/boardgames/${boardgame.parent_id._id}`} className="flex justify-start items-center gap-2">
            <div className="relative w-16 h-16 rounded">
              <Image src={boardgame.parent_id.thumbnail} alt={boardgame.parent_id.title} fill className="object-contain" />
            </div>
            <h3 className="capitalize font-semibold">
              {boardgame.parent_id.title} <span className="text-xs">({boardgame.parent_id.year})</span>
            </h3>
          </Link>
        </>
      )}
    </div>
  );
}
