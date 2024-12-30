'use client'
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ChatPage() {
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
      <div className="flex flex-wrap">
        {boardgames.map((bg) => (
          <Link href={`/chat/${bg._id}`} key={bg._id} style={{ minHeight: "9rem" }}>
            <img src={bg.thumbnail} style={{ minHeight: "9rem" }} />
          </Link>
        ))}
      </div>
    </section>
  );
}
