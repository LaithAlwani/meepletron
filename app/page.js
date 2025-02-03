import Features from "@/components/landingPage/Features";
import Pricing from "@/components/landingPage/Pricing";
import WelcomeMessage from "@/components/landingPage/WelcomeMessage";
import RoadMap from "@/components/landingPage/RoadMap";
import Image from "next/image";
import CustomLink from "@/components/CustomeLink";
import ContactForm from "@/components/ContactForm";
import { FaFacebookF, FaInstagram } from "react-icons/fa";


export const metadata = {
  alternates: {
    canonical: "",
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
        <CustomLink href="/boardgames">Get Started Now</CustomLink>
      </section>
      <Features />
      <Pricing />
      <RoadMap />
      <ContactForm />
      <footer className="py-3">
        <div className="container max-w-xl mx-auto px-4 text-center">
          <div className="flex justify-center space-x-4 p-2">
            <a
              href="https://www.facebook.com/profile.php?id=61572349896501"
              target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer">
              <FaFacebookF size={24} aria-label="facebook" className="" />
            </a>
            <a
              href="https://www.instagram.com/meeple_tron/"
              target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer">
              <FaInstagram size={24} aria-label="instagram" className="" />
            </a>
          </div>
          <nav className="text-center">
            <ul className="flex justify-center space-x-4">
              <li>
                <a href="/privacy-policy" className="hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-of-service" className="hover:underline">
                  Terms of Service
                </a>
              </li>
            </ul>
          </nav>
          <p>&copy; 2025 Meepletron • All rights reserved</p>
        </div>
      </footer>
    </>
  );
}
