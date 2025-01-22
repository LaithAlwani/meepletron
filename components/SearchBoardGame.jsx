import Link from "next/link";
import { useState } from "react";

const SearchBoardGame = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/search?query=${value}`);
      const { data } = await response.json();
      console.log(data);
      setResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="  my-10 py-4">
      <h1 className="text-3xl font-bold text-center dark:text-yellow-500 mb-6">
        Search for Board Games
      </h1>
      <input
        type="text"
        placeholder="Type a board game title..."
        value={query}
        onChange={handleSearch}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
      {loading && <p className="text-gray-500 mt-2">Loading...</p>}

      <ul className="mt-4 bg-gray-200 dark:bg-gray-800 rounded-md divide-y divide-gray-700">
        {results.length === 0 && query && !loading && (
          <li className="p-4 text-gray-400">No results found</li>
        )}
        {results.map((game) => (
          <li key={game._id} className=" p-4 hover:bg-gray-300 dark:hover:bg-yellow-500 dark:hover:text-gray-900 transition">
            <Link href={`/chat/${game._id}`}>
              
              <p className="text-xl capitalize font-semibold">{game.title} <span className="text-sm opacity-75">({game.year})</span></p>
              
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchBoardGame;
