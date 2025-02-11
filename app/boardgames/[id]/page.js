"use client";
import CustomLink from "@/components/CustomeLink";
import Loader from "@/components/Loader";
import Image from "next/image";
import Link from "next/link";
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
      const res = await fetch(`/api/boardgames/${params.id}`);
      if (res.ok) {
        const { data } = await res.json();
        if (data.boardgame) {
          setBoardgame(data.boardgame);
          setExpansions(data.expansions);
        } else {
          setBoardgame(data);
          setExpansions([]);
        }
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
    <div className="max-w-xl mx-auto pt-[6rem]">
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
              <MdGroups size={24} /> {boardgame.min_players} - {boardgame.max_players}
            </p>
            <p className="flex justify-start items-center gap-2 mb-2">
              <MdAccessTime size={24} /> {boardgame.play_time}{" "}
            </p>
            <CustomLink
              href={`/boardgames/${
                (!expansions?.length ? boardgame.parent_id : boardgame._id) || boardgame._id
              }/chat`}>
              Ask a question!
            </CustomLink>
          </div>
          {boardgame.urls.length > 0 && (
            <a href={boardgame.urls[0].blob.url} target="_blank" className="cursor-pointer">
              {boardgame.urls[0].blob.contentDisposition.match(/filename="(.+?)\.pdf"/)[1]}
            </a>
          )}
          {expansions?.length > 0 && (
            <>
              <h3>Expansions</h3>
              <ul className="list-disc ">
                {expansions.map((exp) => (
                  <li key={exp._id}>
                    <Link href={`/boardgames/${exp._id}`}>{exp.title}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {boardgame?.parent_id && (
            <Link href={`/boardgames/${boardgame?.parent_id}`}>Parent Game</Link>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="pt-[6rem]">
      <Loader />
    </div>
  );
}
