import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full flex justify-between items-center bg-slate-900 p-3">
      <Link href="/games" className="p-2">
        Games
      </Link>
      <Link href="/chat" className="p-2">
        Chat
      </Link>
      <Link href="/about" className="p-2">
        About
      </Link>
    </footer>
  );
}
