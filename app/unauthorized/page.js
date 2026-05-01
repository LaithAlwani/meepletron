import Link from "next/link";
import Image from "next/image";
import { MdLogin, MdMenuBook } from "react-icons/md";

export const metadata = {
  title: "Unauthorized",
};

export default async function UnauthorizedPage({ searchParams }) {
  const params = await searchParams;
  const isSignIn = params?.reason === "signin";

  const heading = isSignIn ? "Pull up a chair first" : "It's not your turn";
  const subline = isSignIn
    ? "You'll need to sign in before joining this game. Grab a meeple, take a seat, and we'll deal you in."
    : "This area is reserved for the game master. You don't have the right card to play this round — but the rest of the table is still wide open.";

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
          <span className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md rotate-12">
            401
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          {heading}
        </h1>
        <p className="text-muted text-sm sm:text-base mb-8">
          {subline}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isSignIn && (
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-fg text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
            >
              <MdLogin size={18} />
              Sign In
            </Link>
          )}
          <Link
            href="/boardgames"
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isSignIn
                ? "bg-surface border border-border text-foreground hover:border-primary/40"
                : "bg-primary text-primary-fg shadow-sm hover:opacity-90"
            }`}
          >
            <MdMenuBook size={18} />
            Browse Games
          </Link>
        </div>

      </div>
    </div>
  );
}
