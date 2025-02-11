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
  const trasprent = pathname === "/boardgames" ? "bg-trasprent" : " bg-[#f7f7f7] dark:bg-slate-900";

  return (
    <nav
      className={`fixed top-0 left-0 w-full text-lg p-3 ${trasprent} ${hidden} shadow-sm z-10`}>
      <div className="flex justify-between items-center max-w-xl mx-auto">
        <Link href="/" className="flex items-center justify-start gap-1" aria-label="logo">
          <div className="relative w-[2rem] h-[2rem]">
            <Image src="/chatbot.png" fill priority alt="robot logo" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">Meepletron</h1>
          </div>
        </Link>

        <div className=" ">
          <div className="flex max-w-xl mx-auto items-center justify-between  gap-3">
            <Link href="/boardgames" className="">
              <FaRobot size={24} aria-label="board games" />
            </Link>
            <ThemeSwitch />
            {user?.publicMetadata.role === "admin" && (
              <Link href={"/admin/boardgames"}>
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
