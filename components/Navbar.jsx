import Link from "next/link";
import React from "react";

import { FaRobot, FaInfo, FaClipboardList } from "react-icons/fa";

export default function Navbar() {
  const size = 22;
  return (
    <nav className="w-full bg-[--nav-bg] text-lg p-3">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <strong>
          <Link href="/">
            <h3>Game Rules AI</h3>
          </Link>
        </strong>
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
