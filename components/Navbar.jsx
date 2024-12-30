import Link from "next/link";
import { FaRobot, FaInfo, FaClipboardList } from "react-icons/fa";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="w-full text-lg p-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <Link href="/" className="flex items-center justify-start gap-1 ">
          <div className="relative w-[3rem] h-[3rem]">
            <Image src="/chatbot.png" fill priority alt="robot logo" />
          </div>
          <strong>Rules Guru</strong>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2">
            <FaRobot size={26} />
          </Link>
          <Link href="/games" className="p-2">
            <FaClipboardList size={22} />
          </Link>
          <Link href="/about" className="p-2">
            <FaInfo size={22} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
