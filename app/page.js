import Features from "@/components/landingPage/Features";
import Pricing from "@/components/landingPage/Pricing";
import WelcomeMessage from "@/components/landingPage/WelcomeMessage";
import RoadMap from "@/components/landingPage/RoadMap";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <section className="text-center relative max-w-lg mx-auto px-3">
        <div className="relative max-w-[18rem] sm:w-[20rem] h-[18rem] sm:h-[20rem] mx-auto left-5 my-4">
          <Image src="/chatbot-ed.png" fill priority alt="robot logo" />
          <WelcomeMessage />
        </div>

        <h2 className="text-4xl mb-2 inline-block font-extrabold bg-gradient-to-r from-indigo-500  to-indigo-600 dark:from-yellow-400 dark:to-yellow-500 text-transparent bg-clip-text">
          Meepletron
        </h2>
        <h3 className="text-3xl text-red-500 mt-4 font-semibold animate-bounce uppercase">Alpha</h3>
        <small className="text-sm mb-4">This project is stil in alpha testing.</small>
        <p className="text-lg mt-4">
          Meepletron is your AI-powered board game expert, answering questions directly from
          manuals. Say goodbye to wasting time on game night searching for rule details—get instant
          answers and keep the fun going!
        </p>
        <p className="italic text-md font-semibold ">Your Ultimate Board Game Companion</p>
        <Link
          href="/boardgames"
          className="mt-6 inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg shadow hover:bg-indigo-700 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-slate-900 font-bold">
          Get Started Now
        </Link>
      </section>
      <Features />
      <Pricing />
      <RoadMap />
    </>
  );
}
