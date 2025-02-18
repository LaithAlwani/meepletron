"use client";

import WelcomeMessage from "@/components/landingPage/WelcomeMessage";
import Image from "next/image";
import CustomLink from "@/components/CustomeLink";
import BoardgameContainer from "../boardgame/BoardgameContainer";

export default function Hero({ items }) {
  const recentlyAdded = JSON.parse(items);
  return (
    <>
      <section className="text-center relative max-w-lg mx-auto px-3 pt-[4rem]">
        <div className="relative max-w-[18rem] sm:w-[20rem] h-[18rem] sm:h-[20rem] mx-auto left-5 my-4">
          <Image src="/chatbot-ed.webp" fill priority alt="robot logo" quality={75} sizes={"25vw"} />
          <WelcomeMessage />
        </div>

        <div>
          <h1 className="text-4xl mb-2 inline-block font-extrabold bg-gradient-to-r from-blue-600  to-blue-700 dark:from-yellow-400 dark:to-yellow-500 text-transparent bg-clip-text">
            Meepletron 
            <strong className="block text-2xl font-semibold mt-1">AI Board Games Expert</strong>
          </h1>
          <h2 className="text-3xl text-red-500 mt-4 font-semibold animate-bounce uppercase">
            Alpha
          </h2>
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
        </div>
      </section>

      <section className="max-w-5xl mx-auto my-8 px-4  animate-slidein">
        <h2 className="text-center px-4 mb-6 text-3xl font-bold">Recently Added</h2>
        <div className="flex flex-nowrap justify-start overflow-x-scroll gap-3 ">
          {recentlyAdded?.map((boardgame) => (
            <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
          ))}
        </div>
      </section>
    </>
  );
}
