"use client";
import {useSearch} from "@/utils/hooks";
import Boardgame from "./boardgame/BoardgameContainer";

const SearchBoardGame = ({ onBoardGameClick }) => {
  const { query, setQuery, results, loading } = useSearch("/api/search");

  return (
    <div className="mt-10 py-4">
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

      <div className="flex my-4 gap-4 overflow-x-scroll">
        {results.map((boardgame) => (
          <Boardgame
            key={boardgame._id}
            boardgame={boardgame}
            onClick={() => onBoardGameClick?.(boardgame)}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchBoardGame;
