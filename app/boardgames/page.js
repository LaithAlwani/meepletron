"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BsChatDots } from "react-icons/bs";

export default function BoargamePage() {
  const [boardgames, setBoardgames] = useState([]);
  const [loading, setLoding] = useState(false);

  const getBoardgames = async () => {
    setLoding(true);
    setBoardgames([]);
    const res = await fetch("/api/boardgame");
    if (res.ok) {
      const data = await res.json();
      setBoardgames(data);
    }
    setLoding(false);
  };

  useEffect(() => {
    getBoardgames();
  }, []);
  return (
    <section className="">
      <input type="text" placeholder="search..." className="w-full border rounded p-2 my-2" />
      <h2>Click on a game to chat!</h2>
      <div className="flex flex-wrap gap-1">
        {boardgames.map((bg) => (
          <div className="relative" key={bg._id}>
            <Link href={`/boardgames/${bg._id}`} >
              <img src={bg.image} className="max-h-[10rem]" />
            </Link>
            <Link href={`/chat/${bg._id}`}  className="inline-block absolute bottom-1 right-1 rounded  bg-red-500 p-2 text-white" >
              <BsChatDots size={22} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
