import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import Loading from "./loading";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const viewport = {
  // maximumScale: 1,
  // userScalable:false,
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
};

export const metadata = {
  title: {
    template: "%s | Meepletron | Board games",
    default: "Meepletron: AI Expert for Board Game Rules and Manuals",
  },
  metadataBase: new URL("https://meepletron.com"),
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
    { rel: "apple-touch-icon", url: "icons/icon-128x128.webp" },
    { rel: "icon", url: "icons/icon-128x128.webp" },
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
        url: "https://www.meepletron.com/logo_landscape.png",
        width: 1200,
        height: 630,
      },
      {
        url: "https://www.meepletron.com/logo_landscape.png",
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
          className={`min-h-svh mx-auto bg-[#f7f7f7] dark:bg-slate-900 text-black dark:text-white ${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased `}>
          <Providers>
            <Toaster position="top-right" containerClassName="relative" />
            <Navbar />
            <Suspense fallback={<Loading />}>
              <main className="w-screen mx-auto min-h-svh">{children}</main>
            </Suspense>
          </Providers>
          <SpeedInsights />
        </body>
        <GoogleAnalytics gaId="G-1BPTDRXTZG" />
      </html>
    </ClerkProvider>
  );
}
