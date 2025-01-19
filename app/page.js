"use client";
import Features from "@/components/landingPage/Features";
import Pricing from "@/components/landingPage/Pricing";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { user } = useUser();
  return (
    <>
      <section className="text-center relative max-w-lg mx-auto px-3">
        <div className="relative max-w-[18rem] sm:w-[20rem] h-[18rem] sm:h-[20rem] mx-auto left-5 my-4">
          <Image src="/chatbot-ed.png" fill priority alt="robot logo" />
          <span
            className={`absolute text-left font-bold ${
              user
                ? "text-[18px] right-[1.5rem] top-[2.4rem] sm:top-[2.8rem]"
                : "text-[10px] right-[1rem] top-[2.2rem] sm:top-[2.5rem]"
            }  
            bg-gradient-to-tr from-purple-500 to-red-500 text-transparent bg-clip-text`}>
            {user ? (
              <span>Hi {user.firstName}!</span>
            ) : (
              <span>
                Hi, I'm MeepleTron!
                <br />
                How can I help?!
              </span>
            )}
          </span>
        </div>

        <h2 className="text-2xl md:text-4xl inline-block font-extrabold bg-gradient-to-r from-indigo-500  to-indigo-600 text-transparent bg-clip-text ">
          MeepleTron
        </h2>
        <p className="italic text-sm font-semibold ">Your Ultimate Board Game Companion</p>
        <p className="text-lg mt-4">
          Meepletron is your personal AI board game rules expert, providing instant, accurate answers to
          your board game questions.<br/> Keep the game going!
        </p>
        <Link
          href="/boardgames"
          className="mt-6 inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700">
          Get Started Now
        </Link>
      </section>
      <Features />
      <Pricing />
    </>
  );
}
