import WelcomeMessage from "@/components/landingPage/WelcomeMessage";
import CustomLink from "@/components/CustomeLink";
import { Heading } from "../ui";

export default function Hero() {
  return (
    <section className="text-center relative max-w-lg mx-auto px-3 pt-[6rem]">
      <div className="relative  max-w-[18rem]  h-[20rem] mx-auto left-5 my-12">
        <img src="/logo.webp" className="w-full h-full object-contain"  alt="robot logo"  />
        <WelcomeMessage />
      </div>

      <div>
        <Heading level={1}>Meepletron</Heading>
        <strong className="block italic text-2xl font-semibold text-blue-700 dark:text-yellow-500 mb-2">AI Board Games Expert</strong>
        <p className="text-lg mt-4">
          Meepletron is your AI-powered board game expert, answering questions directly from
          manuals. Say goodbye to wasting time on game night searching for rule details—get instant
          answers and keep the fun going!
        </p>
        <CustomLink href="/boardgames" className="my-4">
          Get Started Now
        </CustomLink>
      </div>
    </section>
  );
}
