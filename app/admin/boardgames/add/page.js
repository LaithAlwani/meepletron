"use client";

import { useState } from "react";
import { createBoardgame, fetchBggGame, fetchBoardGameBGG } from "@/lib/bgg-functions";
import { useSearch } from "@/utils/hooks";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import CustomToast from "@/components/CustomeToast";
import CustomButton from "@/components/CustomeButton";
import Loader from "@/components/Loader";

export default function AddBoardGame() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [gameList, setGameList] = useState([]);
  const [boardgame, setBoardGame] = useState(null);
  const [isExpansion, setIsExpansion] = useState(false);
  const [parentGameId, setParentGameId] = useState("");
  const [file, setFile] = useState(null);
  const [fileText, setFileText] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { query, setQuery, results, loading } = useSearch("/api/search");

  const getBoardGames = async (e) => {
    e.preventDefault();
    try {
      const list = await fetchBggGame(input);
      setGameList(Array.isArray(list) ? list : [list]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getBoardGame = async (id, title) => {
    try {
      const bg = await fetchBoardGameBGG(id);
      const boardgame = createBoardgame(bg, title);
      setBoardGame(boardgame);
      setGameList([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!boardgame) return alert("Please select a board game first.");

    try {
      const parent_id = isExpansion ? parentGameId : "";

      const res = await fetch("/api/boardgames", {
        method: "POST",
        body: JSON.stringify({ boardgame, parent_id }),
      });
      const { data, message } = await res.json;
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${data} uploaded successfully!`} id={t.id} />);
        router.push("/boardgames");
      } else {
        console.log(data);
        toast.error(message || "Something went wrong");
      }
    } catch (err) {
      console.log(err);
      toast.error(err.message || "Server error, please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* Search Board Games */}
      {!boardgame && (
        <form onSubmit={getBoardGames} className="mb-4">
          <input
            type="text"
            placeholder="Search for a board game..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <CustomButton className="w-full">Search</CustomButton>
        </form>
      )}

      {/* Board Game List */}
      {gameList.length > 0 &&
        gameList.map((game) => (
          <p
            key={game["@_id"]}
            onClick={() => getBoardGame(game["@_id"], game.name["@_value"])}
            className="cursor-pointer hover:text-yellow-500">
            {game.name["@_value"]}
          </p>
        ))}

      {/* Selected Board Game */}
      {boardgame && (
        <div className="mt-4">
          <img src={boardgame.thumbnail} alt={boardgame.title} className="w-32 rounded" />
          <p className="font-bold text-lg">{boardgame.title}</p>

          {/* Expansion Checkbox */}
          <label className="flex items-center mt-4 space-x-2">
            <input
              type="checkbox"
              checked={isExpansion}
              onChange={() => setIsExpansion(!isExpansion)}
            />
            <span>Is this an Expansion?</span>
          </label>

          {/* Parent Game Selection for Expansions */}
          {isExpansion && (
            <div className="mt-6">
              <input
                type="text"
                placeholder="Search for parent board game..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border p-2 rounded w-full"
              />
              {loading && <p className="text-gray-500 mt-2">Loading...</p>}
              {!loading && results.length === 0 && query.trim() && (
                <p className="text-gray-400 mt-4">No results found.</p>
              )}

              <div className="flex my-4 gap-4 overflow-x-scroll">
                {results.map((game) => (
                  <div
                    key={game._id}
                    onClick={() => setParentGameId(game._id)}
                    className="cursor-pointer">
                    <img src={game.thumbnail} alt={game.title} className="w-16 rounded" />
                    <h2>{game.title}</h2>
                  </div>
                ))}
              </div>
              <p>Parent Id: {parentGameId}</p>
            </div>
          )}
        </div>
      )}

      {/* File Upload for Manual */}
      {/* {boardGame && (
        <form onSubmit={handleFileUpload} className="mt-6">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
            className="border p-2 rounded w-full"
          />
          <button className="mt-2 bg-indigo-600 dark:bg-yellow-500 px-4 py-2 rounded text-white w-full">
            {isLoading ? <Loader width="1rem" /> : "Extract Text"}
          </button>
        </form>
      )} */}

      {/* Display Extracted Manual Text */}
      {/* {fileText.length > 0 && (
        <div className="mt-6">
          {fileText.map((text, idx) => (
            <pre
              key={idx}
              className="max-w-xl text-wrap border p-2 rounded bg-gray-300 dark:bg-slate-950">
              <details>
                <summary className="text-lg font-bold">Page {text.metadata.loc.pageNumber}</summary>
                {text.pageContent}
              </details>
            </pre>
          ))}
        </div>
      )} */}

      {/* Accept / Reject Buttons */}
      {boardgame && (
        <div className="flex mt-4 gap-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-green-500 disabled:bg-green-300 text-white px-4 py-2 rounded w-full">
            {isLoading ? <Loader width="1rem" /> : "Accept"}
          </button>
          <button
            onClick={() => setBoardGame(null)}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 py-2 rounded w-full disabled:bg-red-300">
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
