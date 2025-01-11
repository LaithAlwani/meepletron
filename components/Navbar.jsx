import Link from "next/link";
import { FaRobot, FaInfo } from "react-icons/fa";
import { MdLogin } from "react-icons/md";
import Image from "next/image";
import ThemeSwitch from "./ThemeSwitch";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="w-full text-lg p-3">
      <div className="flex justify-between items-center max-w-xl mx-auto">
        <Link href="/" className="flex items-center justify-start gap-1 ">
          <div className="relative w-[2rem] h-[2rem]">
            <Image src="/chatbot.png" fill priority alt="robot logo" />
          </div>
          <div className="flex flex-col">
            <strong className="text-xl">BGW</strong>
            {/* <span className="font-semibold text-xs text-[#b5b5b5] dark:text-[#486581]">A Rules AI Wizard</span> */}
          </div>
        </Link>

        <div className=" ">
          <div className="flex max-w-xl mx-auto items-center justify-between  gap-3">
            <Link href="/boardgames" className="">
              <FaRobot size={24} />
            </Link>
            <ThemeSwitch />
              <span className="flex items-center w-[28px] h-[28px]">
                <SignedIn>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <Link href="/sign-in">
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
