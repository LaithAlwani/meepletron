"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BsChatDots } from "react-icons/bs";

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
    <section className="px-2 max-w-xl mx-auto">
      <input
        type="text"
        placeholder="enter game name..."
        className="w-full bg-inherit border rounded p-2 my-2"
      />
      {!loading ? (
        <>
          <div className="relative flex py-5 items-center">
            <div className="w-[3rem] border-t border-gray-400"></div>
            <h2 className=" px-4 text-2xl font-bold italic">Recently Added</h2>
            <div className="flex-grow border-t border-gray-400"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {boardgames?.map((bg) => (
              <div className="relative" key={bg._id}>
                <Link href={`/boardgames/${bg._id}`} className="block w-[11rem] h-[11rem]">
                  <Image
                    src={bg.image}
                    alt={bg.title}
                    className="w-full h-full rounded-md object-cover object-top"
                    fill
                    sizes={"25vw"}
                    quality={10}
                  />
                </Link>
                <Link
                  href={`/chat/${bg._id}`}
                  className="absolute bottom-1 right-1 text-white bg-indigo-600 rounded-full p-2">
                  <BsChatDots size={22} />
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : (
        <img src="/loader.svg" className="animate-spin mt-[10rem] mx-auto" alt="loader" />
      )}
    </section>
  );
}
