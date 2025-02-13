"use client";
import CustomLink from "@/components/CustomeLink";
import Loader from "@/components/Loader";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MdGroups,
  MdOutlineAccessTimeFilled,
  MdMenuBook,
  MdChatBubbleOutline,
} from "react-icons/md";
import { FaChild } from "react-icons/fa";
import { SlBubbles } from "react-icons/sl";
import { ImBubbles } from "react-icons/im";

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
    <div className="max-w-xl mx-auto px-2 pt-[6rem]">
      {boardgame && (
        <div className="flex flex-col justify-start gap-4 items-center">
          {boardgame.image && (
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.2 }}
              transition={{ duration: 0.4 }}
              className=" fixed top-0 left-0 w-full h-screen -z-10">
              <Image
                src={boardgame.image}
                alt={boardgame.title}
                quality={1}
                objectFit="cover"
                fill
                priority
              />
            </motion.div>
          )}
          <div
            className="relative min-w-64 max-w-84  h-64"
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}>
            <Image
              src={boardgame.thumbnail}
              alt={boardgame.title}
              className="w-full h-full rounded-md object-cover object-center"
              fill
              quality={100}
            />
          </div>

          <span className=" px-4 font-semibold tracking-[3px]">{boardgame.designers[0]}</span>

          <h1
            className=" text-lg sm:text-2xl px-4 font-extrabold text-blue-600 dark:text-yellow-500 uppercase drop-shadow-xl  mb-6"
            transition={{ duration: 1 }}>
            {boardgame.title} <span className="text-xs">({boardgame.year})</span>
          </h1>
          <div className="w-[256px] mx-auto flex justify-between items-start">
            <p className="flex flex-col justify-start items-center gap-2 ">
              <MdGroups size={24} />{" "}
              <span className="font-medium">
                {boardgame.min_players} - {boardgame.max_players}
              </span>
            </p>
            <p className="flex flex-col justify-start items-center gap-2 ">
              <MdOutlineAccessTimeFilled size={24} />{" "}
              <span className="font-medium">{boardgame.play_time}</span>
            </p>
            <p className="flex flex-col justify-start items-center gap-2 ">
              <FaChild size={24} /> <span className="font-medium">{boardgame.min_age}+</span>
            </p>
            {boardgame.urls.length > 0 && (
              <a
                target="_blank"
                href={`${boardgame.urls[0].blob.url}`}
                className="flex flex-col justify-start items-center gap-2 capitalize ">
                <MdMenuBook size={24} />{" "}
                <span className="font-medium">
                  {boardgame.urls[0].blob.contentDisposition.match(/filename="(.+?)\.pdf"/)[1]}
                </span>
              </a>
            )}

            <Link
              className="flex flex-col justify-start items-center gap-2 "
              href={`/boardgames/${
                (boardgame.is_expansion ? boardgame?.parent_id._id : boardgame?._id)
              }/chat`}>
              <ImBubbles size={24} />
              <span className="font-medium">Chat</span>
            </Link>
          </div>
        </div>
      )}
      {expansions?.length > 0 && (
        <div>
          <div className="relative flex py-5 items-center ">
            <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
            <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Expansions</h2>
            <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
          </div>

          <ul className="list-disc ">
            {expansions.map((exp) => (
              <li key={exp._id} className="flex justify-start items-end gap-2 mb-2">
                <div className="relative w-16 h-16">
                  <Image src={exp.thumbnail} alt={exp.title} objectFit="contain" fill className="rounded" />
                </div>
                <Link href={`/boardgames/${exp?._id}`}>
                  <h3 className="capitalize font-semibold">
                    {exp.title} <span className="text-xs">({exp.year})</span>
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {boardgame?.parent_id && (
        <>
          <div className="relative flex py-5 items-center ">
            <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
            <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Parent Game</h2>
            <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
          </div>
          <Link
            href={`/boardgames/${boardgame?.parent_id._id}`}
            className="flex justify-start items-center gap-2">
            <div className="relative w-16 h-16 rounded">
              <Image
                src={boardgame?.parent_id?.thumbnail}
                alt={boardgame?.parent_id?.title}
                fill
                objectFit="contain"
              />
            </div>

            <h3 className="capitalize font-semibold">
              {boardgame.parent_id.title} <span className="text-xs">({boardgame.parent_id?.year})</span>
            </h3>
          </Link>
        </>
      )}
    </div>
  ) : (
    <div className="pt-[6rem]">
      <Loader />
    </div>
  );
}
