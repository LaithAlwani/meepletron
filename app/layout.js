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
  title: { template: "%s | Meepletron", default: "Meepletron" },
  description: `Meepletron is your personal AI rules expert, providing instant, accurate answers to your board game questions. Keep the game going!
  Perfect for casual players and board game enthusiasts alike!`,
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
                  &copy; 2025 Board Game Wizard.
                  <br /> All rights reserved.
                </p>
              </div>
            </footer>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
