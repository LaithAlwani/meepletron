import Loader from "@/components/Loader";
import Link from "next/link";
import { MdGroups, MdOutlineAccessTimeFilled, MdMenuBook } from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { ImBubbles } from "react-icons/im";

const dev = "http://localhost:3000";
const prod = "https://www.meepletron.com";

async function getExpansion(id) {
  try {
    const res = await fetch(
      `${process.env.NODE_ENV != "production" ? dev : prod}/api/expansions/${id}`,
      {
        next: { revalidate: 86400 }, // Ensure fresh data
      }
    );

    if (!res.ok) {
      const { message } = await res.json();
      throw new Error(message);
    }
    const  data  = await res.json();
    return { expansion: data };
  } catch (error) {
    return { expansion: null };
  }
}

export default async function ExpansionPage({ params }) {
  const { exp_id } = await params;
  const { expansion } = await getExpansion(exp_id);

  if (!expansion) {
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
          <img
            src={expansion?.thumbnail}
            alt={`${expansion?.title} board game`}
            title={`${expansion?.title} board game`}
            className="w-full h-full rounded-md object-contain object-center"
          />
        </div>
        <hgroup>
          <span className="text-xs px-4 font-semibold tracking-[1px]">
            {expansion?.designers[0]}
          </span>
          <h1 className="text-lg sm:text-2xl px-4 font-extrabold text-blue-600 dark:text-yellow-500 uppercase drop-shadow-xl mb-6">
            {expansion?.title} <span className="text-xs">({expansion?.year})</span>
          </h1>
        </hgroup>
        <div className="w-[256px] mx-auto flex justify-between items-start">
          <p className="flex flex-col justify-start items-center gap-2">
            <MdGroups size={24} />
            <span className="font-medium">
              {expansion?.min_players} - {expansion?.max_players}
            </span>
          </p>
          <p className="flex flex-col justify-start items-center gap-2">
            <MdOutlineAccessTimeFilled size={24} />
            <span className="font-medium">{expansion?.play_time}</span>
          </p>
          <p className="flex flex-col justify-start items-center gap-2">
            <FaChild size={24} />
            <span className="font-medium">{expansion?.min_age}+</span>
          </p>
          {expansion?.urls.length > 0 && (
            <a
              target="_blank"
              href={`${expansion?.urls[0].path}`}
              className="flex flex-col justify-start items-center gap-2 capitalize">
              <MdMenuBook size={24} />
              <span className="font-medium">Rules</span>
            </a>
          )}
          <Link
            className="flex flex-col justify-start items-center gap-2"
            href={`/boardgames/${expansion.parent_id._id}/chat`}>
            <ImBubbles size={24} />
            <span className="font-medium">Chat</span>
          </Link>
        </div>
      </div>

      {/* Parent Game Section */}

      <div className="relative flex py-5 items-center">
        <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
        <h2 className="px-4 text-2xl font-bold italic dark:text-yellow-500">Parent Game</h2>
        <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
      </div>
      <Link
        href={`/boardgames/${expansion.parent_id._id}`}
        className="flex justify-start items-center gap-2">
        <div className="relative w-16 h-16 rounded">
          <img
            src={expansion.parent_id.thumbnail}
            alt={expansion.parent_id.title}
            className="w-full h-full object-contain"
          />
        </div>
        <h3 className="capitalize font-semibold">
          {expansion.parent_id.title} <span className="text-xs">({expansion.parent_id.year})</span>
        </h3>
      </Link>
    </div>
  );
}
