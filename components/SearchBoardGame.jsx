"use client";
import { useSearch } from "@/utils/hooks";
import Link from "next/link";
import { FaComments, FaSearch } from "react-icons/fa";
import Loader from "./Loader";
import { Input } from "./ui";
import { useRef, useState, useEffect } from "react";

const SearchBoardGame = () => {
  const { query, setQuery, results, loading } = useSearch({ limit: 5 });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const divRef = useRef(null);

  const handleClick = () => {
    setQuery("");
    setIsSearchOpen(!isSearchOpen);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (divRef.current && !divRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={divRef}
      className="px-4 flex flex-col items-center justify-center gap-1 cursor-pointer">
      <FaSearch size={24} onClick={handleClick} />
      <span className="text-sm hidden md:block" onClick={handleClick}>
        Search
      </span>

      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto ${
          isSearchOpen ? "h-full" : "h-0"
        } overflow-hidden transition-all`}>
        <Input
          placeholder="Type a board game title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="absolute w-full max-h-80 bg-white dark:bg-slate-600 rounded-b shadow-lg mt-1 overflow-y-auto z-10">
          {loading && <Loader width={"3rem"} />}
          {!loading && results?.length === 0 && query.trim() && (
            <div className="p-3">
              <h3 className="font-semibold">No results found.</h3>
              <p>
                Reqest a Board Game using our{" "}
                <a className="underline" href={"/#contact"}>
                  Contact Form
                </a>
              </p>
            </div>
          )}
          {results?.length > 0 &&
            results.map((boardgame) => (
              <div
                key={boardgame._id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                onClick={() => setIsSearchOpen(false)}>
                <Link
                  href={`/boardgames/${boardgame.parent_id ? boardgame.parent_id : boardgame._id}${
                    boardgame.parent_id ? `/expansions/${boardgame._id}` : ""
                  }`}
                  className="flex items-center gap-3 w-full">
                  <img
                    src={boardgame.thumbnail}
                    alt={boardgame.title}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <span className="capitalize font-semibold text-sm  ">{boardgame.title}</span>
                </Link>
                <Link
                  href={`/boardgames/${
                    boardgame.parent_id ? boardgame.parent_id : boardgame._id
                  }/chat`}
                  className="flex items-center gap-2 border border-slate-500 dark:border-slate-300 rounded-md p-2 text-gray-500 dark:text-slate-200  hover:text-gray-800 dark:hover:text-slate-100">
                  <FaComments size={20} />
                  Chat
                </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBoardGame;
