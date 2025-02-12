"use client";
import { motion } from "motion/react";
import WelcomeMessage from "@/components/landingPage/WelcomeMessage";
import Image from "next/image";
import CustomLink from "@/components/CustomeLink";
import BoardgameContainer from "../boardgame/BoardgameContainer";

export default function Hero({ items }) {
  const recentlyAdded = JSON.parse(items)
  return (
    <>
      <section className="text-center relative max-w-lg mx-auto px-3 pt-[4rem]">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            scale: { type: "spring", visualDuration: 0.6, bounce: 0.3 },
          }}
          className="relative max-w-[18rem] sm:w-[20rem] h-[18rem] sm:h-[20rem] mx-auto left-5 my-4">
          <Image src="/chatbot-ed.webp" fill priority alt="robot logo" />
          <WelcomeMessage />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease: [0, 0.71, 0.2, 1.01],
          }}>
          <h2 className="text-4xl mb-2 inline-block font-extrabold bg-gradient-to-r from-blue-600  to-blue-700 dark:from-yellow-400 dark:to-yellow-500 text-transparent bg-clip-text">
            Meepletron
          </h2>
          <h3 className="text-3xl text-red-500 mt-4 font-semibold animate-bounce uppercase">
            Alpha
          </h3>
          <small className="text-sm mb-4">This project is stil in alpha testing.</small>
          <p className="text-lg mt-4">
            Meepletron is your AI-powered board game expert, answering questions directly from
            manuals. Say goodbye to wasting time on game night searching for rule details—get
            instant answers and keep the fun going!
          </p>
          <p className="italic text-md font-semibold ">Your Ultimate Board Game Companion</p>
          <CustomLink href="/boardgames" className="my-4">
            Get Started Now
          </CustomLink>
        </motion.div>
      </section>
      <motion.section initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1,
            delay: 1,
            ease: [0, 0.71, 0.2, 1.01],
          }} className=" max-w-5xl mx-auto my-8 px-4">
        <h2 className="text-center px-4 mb-6 text-3xl font-bold">Recently Added</h2>

        <div className="flex flex-nowrap justify-start overflow-x-scroll gap-3 ">
          {recentlyAdded?.map((boardgame) => (
            <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
          ))}
        </div>
      </motion.section>
    </>
  );
}
