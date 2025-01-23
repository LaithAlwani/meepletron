"use client";
import Boardgame from "@/components/Boardgame";
import Loader from "@/components/Loader";
import SearchBoardGame from "@/components/SearchBoardGame";
import { useState, useEffect } from "react";

export default function BoargamePage() {
  const [boardgames, setBoardgames] = useState([]);
  const [loading, setLoding] = useState(false);

  const getBoardgames = async () => {
    setLoding(true);
    setBoardgames([]);
    try {
      const res = await fetch("/api/boardgame");
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setBoardgames(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoding(false);
    }
  };

  useEffect(() => {
    getBoardgames();
  }, []);
  return (
    <section className="px-2 max-w-xl mx-auto mb-6">
      <SearchBoardGame />
      {!loading ? (
        <>
          <div className="relative flex py-5 items-center">
            <div className="w-[3rem] border-t border-gray-400 dark:border-yellow-300"></div>
            <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Recently Added</h2>
            <div className="flex-grow border-t border-gray-400 dark:border-yellow-300"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {boardgames?.map((boardgame) => (
              <Boardgame key={boardgame._id} boardgame={boardgame} />
            ))}
          </div>
        </>
      ) : (
        <Loader />
      )}
    </section>
  );
}
