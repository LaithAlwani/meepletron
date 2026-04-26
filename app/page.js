import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import BetaAnnouncement from "@/components/landingPage/BetaAnnouncement";
import HowItWorks from "@/components/landingPage/HowItWorks";
import Features from "@/components/landingPage/Features";
import BoardgameScroller from "@/components/boardgame/BoardgameScroller";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  alternates: {
    canonical: "",
  },
};

export default function Home() {
  return (
    <>
      <BetaAnnouncement />
      <HowItWorks />
      <Features />
      <BoardgameScroller />
      <ContactForm />
      <footer className="py-12 px-4 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex justify-center space-x-5 mb-4">
            <a
              href="https://www.facebook.com/profile.php?id=61572349896501"
              target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              aria-label="Facebook"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <FaFacebookF size={20} />
            </a>
            <a
              href="https://www.instagram.com/meeple_tron/"
              target="_blank"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              aria-label="Instagram"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="#"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              aria-label="YouTube"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <FaYoutube size={20} />
            </a>
            <a
              href="#"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              aria-label="LinkedIn"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <FaLinkedinIn size={20} />
            </a>
            <a
              href="https://x.com/meepletron45657"
              rel="noreferrer noopener"
              referrerPolicy="no-referrer"
              aria-label="X / Twitter"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <FaXTwitter size={20} />
            </a>
          </div>
          <nav className="mb-3">
            <ul className="flex justify-center gap-4 text-sm">
              <li>
                <a
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 underline transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 underline transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </nav>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            &copy; 2025 Meepletron &bull; All rights reserved
          </p>
        </div>
      </footer>
    </>
  );
}
