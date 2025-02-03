"use client";
import CustomLink from "@/components/CustomeLink";
import Loader from "@/components/Loader";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { MdGroups, MdAccessTime } from "react-icons/md";

export default function BoardgamePage() {
  const params = useParams();
  const [boardgame, setBoardgame] = useState(null);
  const [expansions, setExpansions] = useState([]);
  const [loading, setLoading] = useState(false);

  const getBoardgame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boardgame/${params.id}`);
      if (res.ok) {
        const { data } = await res.json();
        setBoardgame(data.boardgame);
        setExpansions(data.expansions);
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
              <MdGroups size={24} /> {boardgame.minPlayers} - {boardgame.maxPlayers}
            </p>
            <p className="flex justify-start items-center gap-2 mb-2">
              <MdAccessTime size={24} /> {boardgame.playTime}{" "}
            </p>
            <CustomLink href={`/chat/${boardgame._id}`}>Ask a question!</CustomLink>
          </div>
          {expansions?.length > 0 && (
            <>
              <h3>Expansions</h3>
              <ul className="list-disc ">
                {expansions.map((exp) => (
                  <li key={exp._id}>{exp.title}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  ) : (
    <Loader />
  );
}
