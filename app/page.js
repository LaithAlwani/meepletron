import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Hero from "@/components/landingPage/Hero";
import Features from "@/components/landingPage/Features";
import Pricing from "@/components/landingPage/Pricing";
import RoadMap from "@/components/landingPage/RoadMap";
import ContactForm from "@/components/ContactForm";
import BoardgameList from "@/components/boardgame/BoardgameList";

export const metadata = {
  alternates: {
    canonical: "",
  },
};

export default async function Home() {
  return (
    <>
      <Hero />
      <section className="max-w-5xl mx-auto my-8 px-4  animate-slidein">
        <h2 className="text-center px-4 mb-6 text-3xl font-bold">Recently Added</h2>
        <div className="flex flex-nowrap justify-start overflow-x-scroll gap-3 ">
          <BoardgameList />
        </div>
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
            <a
              href="#"
              // target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer">
              <FaYoutube size={24} aria-label="youtube" className="" />
            </a>
            <a
              href="#"
              // target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer">
              <FaLinkedinIn size={24} aria-label="linkedin" className="" />
            </a>
            <a
              href="https://x.com/meepletron45657"
              // target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer">
              <FaXTwitter size={24} aria-label="twitter-x" className="" />
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
