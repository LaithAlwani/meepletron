"use client";
import Loader from "@/components/Loader";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

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
        <div className="flex justify-start gap-4 items-center">
          <div className="relative  min-w-[12rem] h-[12rem]">
            {console.log(boardgame)}
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
            <h2 className="text-2xl font-bold capitalize">
              {boardgame.title} <span className="text-xs font-light">({boardgame.year}) </span>
            </h2>
            <p>
              players: {boardgame.minPlayers} - {boardgame.maxPlayers}
            </p>
            <p>play time: {boardgame.playTime} </p>
            <Link
              href={`/chat/${boardgame._id}`}
              className="inline-block rounded  mt-3 font-bold bg-[#f95644] dark:bg-[#1887ba] p-3">
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
