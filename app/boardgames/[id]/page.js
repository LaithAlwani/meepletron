"use client";
import Loader from "@/components/Loader";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MdGroups, MdAccessTime  } from "react-icons/md";


export default function BoardgamePage() {
  const params = useParams();
  const [boardgame, setBoardgame] = useState(null);
  const [loading, setLoading] = useState(false);

  const getBoardgame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boardgame/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBoardgame(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getBoardgame();
  }, []);
  return !loading ? (
    <div className=" pt-12 max-w-xl mx-auto ">
      {boardgame && (
        <div className="flex flex-col justify-start gap-4 items-center">
          <div className="relative  min-w-[12rem] h-[12rem]">
            <Image
              src={boardgame.image}
              alt={boardgame.title}
              className="w-full h-full rounded-md object-cover object-center"
              fill
              sizes={"25vw"}
              quality={10}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold capitalize mb-4">
              {boardgame.title} <span className="text-xs font-light">({boardgame.year}) </span>
            </h2>
            <p className="flex justify-start items-center gap-2 mb-2">
              <MdGroups size={24}/> {boardgame.minPlayers} - {boardgame.maxPlayers}
            </p>
            <p className="flex justify-start items-center gap-2 mb-2"><MdAccessTime size={24}/> {boardgame.playTime} </p>
            <Link
              href={`/chat/${boardgame._id}`}
              className="w-full text-center inline-block rounded  mt-3 font-bold bg-indigo-600 hover:bg-indigo-500 dark:dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 p-3">
              Ask a question!
            </Link>
          </div>
        </div>
      )}
    </div>
  ) : (
    <Loader />
  );
}
