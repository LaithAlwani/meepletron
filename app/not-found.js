import Link from "next/link";
import Image from "next/image";
import { MdMenuBook } from "react-icons/md";
import { IoChatbubbles } from "react-icons/io5";

export const metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-svh flex items-center justify-center px-4 pt-20 pb-16">
      <div className="max-w-md w-full text-center">

        <div className="relative inline-block mb-6">
          <Image
            src="/logo.webp"
            alt="Meepletron"
            width={120}
            height={120}
            priority
          />
          <span className="absolute -top-3 -right-3 bg-primary text-primary-fg text-sm font-bold px-3 py-1 rounded-full shadow-md rotate-12">
            404
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          You drew an empty card
        </h1>
        <p className="text-muted text-sm sm:text-base mb-8">
          This page isn&apos;t in the rulebook. Maybe it rolled off the table — or it never existed at all. Pick a path and keep playing.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/boardgames"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-fg text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
          >
            <MdMenuBook size={18} />
            Browse Board Games
          </Link>
          <Link
            href="/chats"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm font-semibold hover:border-primary/40 transition-all"
          >
            <IoChatbubbles size={18} />
            View Chats
          </Link>
        </div>

      </div>
    </div>
  );
}
