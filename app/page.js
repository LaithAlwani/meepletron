"use client";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
export default function Home() {
  const { user } = useUser();
  return (
    <>
      <div className="text-center pt-32 relative">
        <div className="relative w-[18rem] sm:w-[20rem] h-[18rem] sm:h-[20rem] mx-auto left-5">
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

        <h1 className="text-2xl sm:text-4xl uppercase font-bold pt-5 bg-gradient-to-br from-yellow-500 via-red-500 to-purple-500 text-transparent bg-clip-text">
          Board Game Wizard
        </h1>
        <p className="italic text-sm font-semibold pb-5">No more rulebook flipping!</p>
        <Link
          href={user ? "/boardgames" : "/sign-in"}
          className="inline-block rounded min-w-64  mx-1 font-bold bg-[#f95644] dark:bg-[#1887ba] p-3">
          Get Started
        </Link>
      </div>
    </>
  );
}
