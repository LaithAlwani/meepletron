"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import CustomLink from "../CustomeLink";
import { Poppins } from "next/font/google";
import Link from "next/link";

export default function Carousel({ items }) {
  const boardgames = JSON.parse(items);
  const [index, setIndex] = useState(0);

  // const nextSlide = () => setIndex((prev) => (prev + 1) % boardgames.length);
  // const prevSlide = () => setIndex((prev) => (prev - 1 + boardgames.length) % boardgames.length);

  return (
    <div className="w-full h-screen mx-auto flex flex-col justify-between">
      {/* Enlarged Image with Animation */}
      <div className=" sm:pl-32 p-2 mt-6">
        <motion.img
          key={index}
          src={boardgames[index].image}
          alt={boardgames[index].title}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 0.5 }}
          className=" fixed top-0 left-0 w-full h-screen object-cover -z-10"
        />
        <span className="font-semibold tracking-widest">{boardgames[index].designers[0]}</span>
        <motion.h1
          className=" text-[2em] lg:text-[3em] font-black text-blue-600 dark:text-yellow-500 uppercase drop-shadow-md mb-4"
          transition={{ duration: 1 }}>
          {boardgames[index].title}
        </motion.h1>
        <p className="max-w-[450px] font-semibold drop-shadow-md mb-8">
          {boardgames[index].description.substring(0, 200)}...
        </p>
        <div className=" text-left md:px-0 [&>*]:mr-2">
          <Link
            href={`/boardgames/${boardgames[index]._id}`}
            className="text-center inline-block p-3  border-2 border-black text-black dark:text-white dark:border-white font-semibold min-w-32 ">
            {" "}
            More
          </Link>
          <Link
            href={`/boardgames/${boardgames[index]._id}/chat`}
            className="text-center inline-block p-3 bg-slate-300 border-2 border-slate-300 text-black  font-semibold min-w-32">
            Chat
          </Link>
        </div>
      </div>

      {/* Thumbnail Row */}
      <div>
        <div className="relative flex py-1 items-center ">
          <div className="w-[3rem] border-t-2 border-gray-800 dark:border-yellow-300"></div>
          <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500 drop-shadow-md">Recently Added</h2>
          <div className="flex-grow border-t-2 border-gray-800 dark:border-yellow-300"></div>
        </div>
        <div className=" p-2 flex flex-nowrap gap-2 items-center justify-start lg:justify-center overflow-x-scroll">
          {boardgames.map((boardgame, i) => (
            <motion.img
              key={i}
              src={boardgame.image}
              alt={boardgame.title}
              className={` h-32 rounded-lg cursor-pointer   ${
                i === index ? "border-2 border-blue-500 dark:border-yellow-500 h-36" : ""
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
