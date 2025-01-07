import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Providers from "./providers";

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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-[100svh] mx-auto bg-[#f7f7f7] dark:bg-[#151e32]  t ${geistSans.variable} ${geistMono.variable} antialiased `}>
        <Providers>
          <Navbar />
          <main className="max-w-xl mx-auto px-3">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
