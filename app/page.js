import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { getBoardgames } from "@/lib/functions";
import Hero from "@/components/landingPage/Hero";
import BoardgameContainer from "@/components/boardgame/BoardgameContainer";
import Features from "@/components/landingPage/Features";
import Pricing from "@/components/landingPage/Pricing";
import RoadMap from "@/components/landingPage/RoadMap";
import ContactForm from "@/components/ContactForm";


export const metadata = {
  alternates: {
    canonical: "",
  },
};

export default async function Home() {
  const recentlyAdded = await getBoardgames({ where: { is_expansion: false }, limit: 10 });
  return (
    <>
      <Hero items={JSON.stringify(recentlyAdded)} />
      
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
