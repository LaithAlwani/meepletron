"use client";
import Features from "@/components/landingPage/Features";
import Pricing from "@/components/landingPage/Pricing";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  const { user } = useUser();
  return (
    <>
      {/* <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Board Game Wizard</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="#features" className="hover:underline">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:underline">
                How It Works
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:underline">
                Pricing
              </a>
            </li>
          </ul>
        </nav>
      </div> */}
      <section className="text-center relative max-w-lg mx-auto px-3">
        <div className="relative max-w-[18rem] sm:w-[20rem] h-[18rem] sm:h-[20rem] mx-auto left-5 my-4">
          <Image src="/chatbot-ed.png" fill priority alt="robot logo" />
          <span
            className={`absolute text-left font-bold ${
              user
                ? "text-[18px] top-[2.4rem] sm:top-[2.8rem]"
                : "text-[10px] top-[1.8rem] sm:top-[2.1rem]"
            }  
          right-[1.6rem] sm:right-[2rem] bg-gradient-to-tr from-purple-500 to-red-500 text-transparent bg-clip-text`}>
            {user ? (
              <span>Hi {user.firstName}!</span>
            ) : (
              <span>
                Hi, I'm Jenna!
                <br />
                The rules AI.
                <br />
                Ready to help!
              </span>
            )}
          </span>
        </div>

        <h2 className="text-2xl md:text-4xl inline-block font-extrabold bg-gradient-to-r from-indigo-500  to-indigo-600 text-transparent bg-clip-text">
          No More Rulebooks. Just Play!
        </h2>
        <p className="italic text-sm font-semibold ">Your Ultimate Board Game Companion</p>
        <p className="text-lg mt-4">
          Board Game Wizard is your personal AI rules expert, providing instant, accurate answers to
          your board game questions. Keep the game going!
        </p>
        <a
          href="#get-started"
          className="mt-6 inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700">
          Get Started Now
        </a>
      </section>

      <Features />

      <Pricing />
    </>
  );
}
