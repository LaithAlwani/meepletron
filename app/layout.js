import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: "%s | Meepletron",
    default: "Meepletron: AI Expert for Board Game Manuals – Instant Rule Answers",
  },
  description: `Meepletron, the AI board game expert, answers rule questions instantly. 
  No more wasting time searching manuals—keep game night fun and hassle-free!`,
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["boardgames", "board game rules", "board game wizard", "board game assistant"],
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  authors: [
    {
      name: "Laith Alwani",
      url: "https://www.linkedin.com/in/laithalwani/",
    },
  ],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "icons/icon-128x128.png" },
    { rel: "icon", url: "icons/icon-128x128.png" },
  ],
  robots: {
    index: false,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Meepletron: The AI board game expert',
    description: 'Answers rule questions instantly.',
    url: 'https://www.meepeletron.com',
    siteName: 'meepeletron',
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
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`min-h-[100svh] mx-auto bg-[#f7f7f7] dark:bg-[#151e32] text-gray-800 dark:text-gray-200 ${geistSans.variable} ${geistMono.variable} antialiased `}>
          <Providers>
            <Navbar />
            <main className="w-screen mx-auto  min-h-[78svh]">{children}</main>
            <footer className="py-3">
              <div className="container mx-auto px-4 text-center">
                <p>
                  &copy; 2025 Meepletron • All rights reserved.
                </p>
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
