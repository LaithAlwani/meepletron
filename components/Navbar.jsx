"use client";
import Link from "next/link";
import { FaRobot, FaUserLock } from "react-icons/fa";
import { MdLogin } from "react-icons/md";
import Image from "next/image";
import ThemeSwitch from "./ThemeSwitch";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const hidden = pathname.includes("chat") ? "hidden" : "";
  const boardgame_id = pathname.split("/boardgames")[1]
  const trasprent = boardgame_id ? "bg-trasprent" : " bg-[#f7f7f7] dark:bg-slate-900";
 
  return (
    <nav
      className={`fixed top-0 left-0 w-full text-lg p-3 ${trasprent} ${hidden} shadow-sm z-10`}>
      <div className="flex justify-between items-center max-w-xl mx-auto">
        <Link href="/" className="flex items-center justify-start gap-1" aria-label="logo">
          <div className="relative w-[2rem] h-[2rem]">
            <Image src="/chatbot.webp" fill priority alt="robot logo" quality={25} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold">Meepletron</span>
          </div>
        </Link>

        <div className=" ">
          <div className="flex  mx-auto items-center justify-between gap-3">
            <Link href="/boardgames" className="" aria-label="board games">
              <FaRobot size={24} aria-label="board games" />
            </Link>
            <ThemeSwitch />
            {user?.publicMetadata.role === "admin" && (
              <Link href={"/admin/boardgames"} aria-label="admin">
                <FaUserLock />
              </Link>
            )}
            <span className="flex items-center w-[28px] h-[28px]">
              <SignedIn>
                <UserButton aria-label="user settings" />
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in" aria-label="sign-in">
                  <MdLogin size={24} />
                </Link>
              </SignedOut>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
