import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Board Game Wizard",
  description: `Instantly search and understand board game rules with ease! Powered by AI,
   our app eliminates the need to flip through manuals,
   so you can focus on playing and having fun.
  Perfect for casual players and board game enthusiasts alike!`,
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["boardgames", "board game rules", "board game wizard", "board game assistant"],
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  authors: [
    {
      name: "imvinojanv",
      url: "https://www.linkedin.com/in/imvinojanv/",
    },
  ],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "icons/icon-128x128.png" },
    { rel: "icon", url: "icons/icon-128x128.png" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`min-h-[100svh] mx-auto bg-[#f7f7f7] dark:bg-[#151e32]  t ${geistSans.variable} ${geistMono.variable} antialiased `}>
          <Providers>
            <Navbar />
            <main className="max-w-xl mx-auto px-3 min-h-[86svh]">{children}</main>
            
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}

