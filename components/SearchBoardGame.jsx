"use client";
import { useEffect, useState } from "react";
import Boardgame from "./boardgame/BoardgameContainer";

const SearchBoardGame = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query); // Holds the debounced value

  const fetchResults = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/search?query=${debouncedQuery}`);
      const { data } = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler); // Clear the timeout if the user types again
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    fetchResults();
  }, [debouncedQuery]);

  return (
    <div className="mt-10 py-4">
      <h1 className="text-3xl font-bold text-center dark:text-yellow-500 mb-6">
        Search for Board Games
      </h1>
      <input
        type="text"
        placeholder="Type a board game title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
      {loading && <p className="text-gray-500 mt-2">Loading...</p>}

      {results.length === 0 && debouncedQuery && !loading && (
        <div className="mt-4 bg-gray-200 dark:bg-gray-800 rounded-md divide-y divide-gray-700">
          <p className="p-4 text-gray-400">No results found</p>
        </div>
        // add a components that allows users to send which games they like to see
      )}
      <>
        {results.length > 0 && (
          <div className="relative flex py-5 items-center">
            <div className="w-[3rem] border-t border-gray-400 dark:border-yellow-300"></div>
            <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Search Results</h2>
            <div className="flex-grow border-t border-gray-400 dark:border-yellow-300"></div>
          </div>
        )}
        <div className="flex my-4 gap-4 overflow-x-scroll">
          {results.map((boardgame) => (
            <Boardgame key={boardgame._id} boardgame={boardgame} />

            // <li key={game._id} className=" p-4 hover:bg-gray-300 dark:hover:bg-yellow-500 dark:hover:text-gray-900 transition">
            //   <Link href={`/chat/${game._id}`}>

            //     <p className="text-xl capitalize font-semibold">{game.title} <span className="text-sm opacity-75">({game.year})</span></p>

            //   </Link>
            // </li>
          ))}
        </div>
      </>
    </div>
  );
};

export default SearchBoardGame;
