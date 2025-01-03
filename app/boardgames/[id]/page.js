"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function BoardgamePage() {
  const params = useParams();
  const [boardgame, setBoardgame] = useState(null);

  const getBoardgame = async () => {
    const res = await fetch(`/api/boardgame/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setBoardgame(data);
    }
  };
  useEffect(() => {
    getBoardgame();
  }, []);
  return (
    <div className="text-center pt-12 ">
      {boardgame && (
        <div className="flex justify-center items-center">
          <div className="relative mx-auto w-[10rem] h-[10rem]">
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
            <h2 className="text-2xl font-bold capitalize">{boardgame.title}</h2>
            <p>
              players: {boardgame.minPlayers} - {boardgame.maxPlayers}
            </p>
            <p>playTime: {boardgame.playTime} </p>
            <p>{boardgame.year} </p>
            <Link
              href={`/chat/${boardgame._id}`}
              className="inline-block rounded min-w-32  mx-1 font-bold bg-[--btn-primary] p-3">
              Chat Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
