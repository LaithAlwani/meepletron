import Link from "next/link";
import { GiMeepleKing } from "react-icons/gi";

import { FaRobot, FaInfo, FaClipboardList } from "react-icons/fa";
import Image from "next/image";

export default function Navbar() {
  const size = 22;
  return (
    <nav className="w-full bg-[--nav-bg]  text-lg p-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <Link href="/" className="flex items-center justify-start gap-1 ">
          <div className="relative w-[3rem] h-[3rem]">
            <Image src="/chatbot.png" fill priority alt="robot logo" />
          </div>
          <strong>Rules Guru</strong>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2">
            <FaRobot size={size} />
          </Link>
          <Link href="/games" className="p-2">
            <FaClipboardList size={size} />
          </Link>
          <Link href="/about" className="p-2">
            <FaInfo size={size} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
