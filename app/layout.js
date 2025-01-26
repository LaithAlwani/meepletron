import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
};

export const metadata = {
  title: {
    template: "%s | Meepletron | Board games",
    default: "Meepletron: AI Expert for Board Game Rules and Manuals",
  },
  metadataBase: new URL('https://meepletron.com'),
  description: `The AI board games and tabletop games expert, answers rule questions instantly. 
  No more wasting time searching manuals`,
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: [
    "board games",
    "board game rules",
    "board game meeple",
    "board game assistant",
    "meeple",
    "tapletop games",
    "moedern board games",
  ],
  authors: [
    {
      name: "Laith Alwani",
      url: "https://www.linkedin.com/in/laithalwani/",
    },
  ],

  icons: [
    { rel: "apple-touch-icon", url: "icons/icon-128x128.png" },
    { rel: "icon", url: "icons/icon-128x128.png" },
  ],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": "large",
      "max-image-preview": "large",
      "max-snippet": 320,
    },
  },
  openGraph: {
    title: "Meepletron: The AI board game expert",
    description: "Answers rule questions instantly.",
    url: "https://www.meepeletron.com",
    siteName: "meepeletron",
    images: [
      {
        url: "https://og-image-wheat.vercel.app/api/og?title=Meepletron&description=The+AI+board+game+expert&logoUrl=https%3A%2F%2Fwww.meepletron.com%2Fchatbot.png",
        width: 1200,
        height: 630,
      },
      {
        url: "https://og-image-wheat.vercel.app/api/og?title=Meepletron&description=The+AI+board+game+expert&logoUrl=https%3A%2F%2Fwww.meepletron.com%2Fchatbot.png",
        width: 400,
        height: 400,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`min-h-[100svh] mx-auto bg-[#f7f7f7] dark:bg-slate-900 text-gray-800 dark:text-gray-200 ${geistSans.variable} ${geistMono.variable} antialiased `}>
          <Providers>
            <Navbar />
            <main className="w-screen mx-auto  min-h-[84svh]">{children}</main>
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
          </Providers>
          <SpeedInsights />
        </body>
        <GoogleAnalytics gaId="G-1BPTDRXTZG" />
      </html>
    </ClerkProvider>
  );
}
