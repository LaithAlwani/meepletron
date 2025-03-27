"use client";
import { motion } from "motion/react";
import CustomLink from "../CustomeLink";
import { useUser } from "@clerk/nextjs";

export default function BetaAnnouncement() {
  const { user } = useUser();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-center px-4 pt-[6rem] ">
      <div className="max-w-2xl w-full p-6 ">
        <div className="space-y-6 text-center">
          <div className="flex justify-center text-4xl text-yellow-400">
            <div className="relative  w-[10rem] h-[10rem] mx-auto left-5 ">
              <img src="/logo.webp" className="object-contain w-full h-full" alt="robot logo" />
              {/* <WelcomeMessage /> */}
            </div>
          </div>
          <h1 className="text-3xl font-bold">Meepletron AI Board Games Expert!</h1>
          <p className="text-lg text-slate-800 dark:text-gray-300">
            Meepletron is officially in{" "}
            <span className="text-blue-500 dark:text-yellow-400 font-semibold"> 🚀 BETA testing</span>,
            and we’re excited to have you try it out!
          </p>
          <div className="text-left space-y-4">
            <h2 className="text-xl font-semibold text-blue-500 dark:text-yellow-400">
            🎲 What is Meepletron?
            </h2>
            <p>
              Meepletron is your instant board games rule reference—no more flipping through manuals!
              Quickly look up rules and get clear answers fast.
            </p>
            <h3 className="text-xl font-semibold text-blue-500 dark:text-yellow-400">
              🟢 What can you do?
            </h3>
            <ul className="list-disc list-inside text-slate-800 dark:text-gray-300 space-y-2">
              <li>Ask questions about board game rules.</li>
              <li>
                Request new Board Games using our{" "}
                <a href="#contact" className="underline font-semibold">
                  Contact form
                </a>
                .
              </li>
              <li>
                <span className="font-semibold text-black dark:text-white">
                  No account is required during Beta
                </span>
                —just start asking!
              </li>
            </ul>
            <h3 className="text-xl font-semibold text-blue-500 dark:text-yellow-400">
              💡 Your feedback matters!
            </h3>
            <p className="text-slate-800 dark:text-gray-300">
              Since we're in BETA, your input is crucial. Let us know if an answer was helpful to
              help us improve Meepletron!
            </p>
            <h3 className="text-xl font-semibold text-blue-500 dark:text-yellow-400">
              🔹 Want to access your chat history?
            </h3>
            <p className="text-slate-800 dark:text-gray-300">
              Log in to save and revisit your past chats anytime.
            </p>
          </div>
          {user ? (
            <CustomLink href={"/boardgames"}>Try Meepletron Now!</CustomLink>
          ) : (
            <CustomLink href={"/sign-in"}>Create a Free Account!</CustomLink>
          )}
        </div>
      </div>
    </motion.div>
  );
}
