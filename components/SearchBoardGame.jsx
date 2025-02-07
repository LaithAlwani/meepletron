"use client";
import { useSearch } from "@/utils/hooks";
import Link from "next/link";
import { FaComments } from "react-icons/fa";

const SearchBoardGame = ({ onBoardGameClick }) => {
  const { query, setQuery, results, loading } = useSearch({limit:2});

  return (
    <div className="relative mt-10 py-4 w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Type a board game title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
      {loading && <p className="text-gray-500 mt-2">Loading...</p>}

      {!loading && results.length === 0 && query.trim() && (
        <p className="text-gray-400 mt-4">No results found.</p>
      )}

      {results.length > 0 && (
        <div className="absolute w-full bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-800 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-10">
          {results.map((boardgame) => (
            <div
              key={boardgame._id}
              className="flex items-center justify-between gap-3 p-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
             
              <Link
                href={`/boardgames/${boardgame._id}`}
                className="flex items-center gap-3 w-full"
                onClick={() => onBoardGameClick?.(boardgame)}>
                <img
                  src={boardgame.thumbnail}
                  alt={boardgame.title}
                  className="w-12 h-12 rounded-md object-cover"
                />
                <span className="capitalize font-semibold text-sm  ">{boardgame.title}</span>
              </Link>
              <Link
                href={`/boardgames/${boardgame.parent_id ? boardgame.parent_id : boardgame._id}/chat`}
                className="flex items-center gap-2 border border-slate-500 dark:border-slate-300 rounded-md p-2 text-gray-500 dark:text-slate-200  hover:text-gray-800 dark:hover:text-slate-100">
                <FaComments size={20} />
                Chat
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBoardGame;
