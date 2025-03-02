"use client";
import { Children, useState } from "react";
import Link from "next/link";
import { FaUserLock } from "react-icons/fa";
import { MdLogin } from "react-icons/md";
import Image from "next/image";
import ThemeSwitch from "./ThemeSwitch";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ImBubbles } from "react-icons/im";
import { GiOpenBook } from "react-icons/gi";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const hidden = /chat\b/.test(pathname) ? "hidden" : "";
  const boardgame_id = pathname.split("/boardgames")[1];
  const trasprent =
    boardgame_id && boardgame_id !== "/edit" && boardgame_id !== "/add"
      ? "bg-transparent"
      : "bg-[#f7f7f7] dark:bg-slate-900";

  const getLinkClass = (path) =>
    pathname === path
      ? "bg-blue-500 dark:bg-yellow-500 text-white"
      : "hover:bg-gray-200 dark:hover:bg-gray-700";

  return (
    <nav className={`fixed top-0 left-0 w-full text-lg p-3 ${trasprent} ${hidden} shadow-sm z-10`}>
      <div className="flex justify-between items-center max-w-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1" aria-label="logo">
          <div className="relative w-[2rem] h-[2rem]">
            <Image
              src="/logo.webp"
              style={{ objectFit: "contain" }}
              fill
              priority
              alt="robot logo"
              quality={25}
            />
          </div>
          <span className="text-xl font-bold">Meepletron</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center items-center gap-3">
          <Link href="/chats" aria-label="chats" className="flex flex-col  items-center gap-1">
            <ImBubbles size={24} /> <span className="text-sm">Chats</span>
          </Link>
          <Link
            href="/boardgames"
            aria-label="board games"
            className="flex flex-col items-center gap-1">
            <GiOpenBook size={24} /> <span className="text-sm">Board Games</span>
          </Link>
          <span className="flex flex-col items-center gap-1" >
            <ThemeSwitch  />
          </span>
          {user?.publicMetadata.role === "admin" && (
            <Link
              href="/admin/boardgames"
              aria-label="admin"
              className="flex flex-col  items-center gap-1">
              <FaUserLock size={24} /> <span className="text-sm">Admin</span>
            </Link>
          )}
          <span className="flex flex-col items-center ">
            <SignedIn>
              <UserButton aria-label="user settings" /> <span className="text-sm">Settings</span>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                aria-label="sign-in"
                className="flex flex-col  items-center gap-1">
                <MdLogin size={24} /> <span className="text-sm">Sign In</span>
              </Link>
            </SignedOut>
          </span>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 z-20"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="menu toggle">
          {isOpen ? <FiX size={30} /> : <FiMenu size={30} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out 
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 flex flex-col gap-4">
          <Link
            href="/chats"
            aria-label="chats"
            className="flex items-center gap-1"
            onClick={() => setIsOpen(false)}>
            <ImBubbles size={24} /> <span className="text-sm">Chats</span>
          </Link>
          <Link
            href="/boardgames"
            aria-label="board games"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}>
            <GiOpenBook size={24} /> <span className="text-sm">Board Games</span>
          </Link>
          <span className="flex items-center gap-2" onClick={()=>setIsOpen(false)}>
            <ThemeSwitch />
          </span>
          {user?.publicMetadata.role === "admin" && (
            <Link
              href="/admin/boardgames"
              aria-label="admin"
              className="flex items-center gap-2"
              onClick={() => setIsOpen(false)}>
              <FaUserLock size={28} /> <span className="text-sm">Admin</span>
            </Link>
          )}
          <SignedIn>
            <span className="flex items-center gap-2">
              <UserButton aria-label="user settings" /> <span className="text-sm">Settings</span>
            </span>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              aria-label="sign in"
              className="flex items-center gap-2"
              onClick={() => setIsOpen(false)}>
              <MdLogin size={24} /> <span className="text-sm">Sign In</span>
            </Link>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}

const NavLink = ({ children, href, label }) => {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex items-center gap-1"
      onClick={() => setIsOpen(false)}>
      {children}
    </Link>
  );
};
