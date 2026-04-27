"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FaUserLock } from "react-icons/fa";
import { MdLogin } from "react-icons/md";
import ThemeSwitch from "./ThemeSwitch";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ImBubbles } from "react-icons/im";
import { GiOpenBook } from "react-icons/gi";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const hidden = /chat\b/.test(pathname) ? "hidden" : "";
  const boardgame_id = pathname.split("/boardgames")[1];
  const isBoardgamePage = boardgame_id && boardgame_id !== "/edit" && boardgame_id !== "/add";

  useEffect(() => {
    if (!isBoardgamePage) return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isBoardgamePage]);

  const bgClass = isBoardgamePage && !scrolled ? "bg-transparent" : "bg-bg";

  return (
    <nav className={`fixed top-0 left-0 w-full text-lg p-3 ${bgClass} ${hidden} shadow-sm z-50 transition-colors duration-300`}>
      <div className="flex justify-end items-center max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-1 mr-auto" aria-label="Meepletron logo">
          <div className="relative w-[2rem] h-[2rem]">
            <img src="/logo.webp" className="w-full h-full object-contain" alt="Meepletron logo" />
          </div>
          <span className="text-xl font-bold">Meepletron</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center items-center gap-3">
          <Link href="/boardgames" aria-label="board games" className="flex flex-col items-center gap-1">
            <GiOpenBook size={24} /> <span className="text-sm">Board Games</span>
          </Link>
          <Link href="/chats" aria-label="chats" className="flex flex-col items-center gap-1">
            <ImBubbles size={24} /> <span className="text-sm">Chats</span>
          </Link>
          <span className="flex flex-col items-center gap-1">
            <ThemeSwitch />
          </span>
          {user?.publicMetadata.role === "admin" && (
            <Link href="/admin" aria-label="admin" className="flex flex-col items-center gap-1">
              <FaUserLock size={24} /> <span className="text-sm">Admin</span>
            </Link>
          )}
          <span className="flex flex-col items-center gap-1 min-w-[2.5rem]">
            {!isLoaded ? (
              <>
                <div className="w-6 h-6 rounded-full bg-surface-muted" />
                <span className="text-sm opacity-0">Sign In</span>
              </>
            ) : user ? (
              <Link href="/profile" aria-label="profile" className="flex flex-col items-center gap-1">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                    {user.firstName?.[0] ?? "?"}
                  </div>
                )}
                <span className="text-sm">Profile</span>
              </Link>
            ) : (
              <Link href="/sign-in" aria-label="sign-in" className="flex flex-col items-center gap-1">
                <MdLogin size={24} /> <span className="text-sm">Sign In</span>
              </Link>
            )}
          </span>
        </div>

        <button
          className="md:hidden p-2 z-20"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="menu toggle">
          {isOpen ? <FiX size={30} /> : <FiMenu size={30} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-64 pt-[3rem] z-10 bg-surface shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}>
        <div className="p-5 flex flex-col gap-4">
          <Link href="/boardgames" aria-label="board games" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <GiOpenBook size={24} /> <span className="text-sm">Board Games</span>
          </Link>
          <Link href="/chats" aria-label="chats" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <ImBubbles size={24} /> <span className="text-sm">Chats</span>
          </Link>
          <span className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <ThemeSwitch />
          </span>
          {user?.publicMetadata.role === "admin" && (
            <Link href="/admin" aria-label="admin" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <FaUserLock size={28} /> <span className="text-sm">Admin</span>
            </Link>
          )}
          {user ? (
            <Link href="/profile" aria-label="profile" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              {user.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                  {user.firstName?.[0] ?? "?"}
                </div>
              )}
              <span className="text-sm">Profile</span>
            </Link>
          ) : (
            <Link href="/sign-in" aria-label="sign in" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <MdLogin size={24} /> <span className="text-sm">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
