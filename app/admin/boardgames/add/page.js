"use client";
import { upload } from "@vercel/blob/client";
import { useState, useRef } from "react";
import { createBoardgame, fetchBggGames, fetchBoardGameBGG } from "@/lib/bgg-functions";
import { useSearch } from "@/utils/hooks";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import CustomToast from "@/components/CustomeToast";
import CustomButton from "@/components/CustomeButton";
import Loader from "@/components/Loader";

export default function AddBoardgame() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [gameList, setGameList] = useState([]);
  const [boardgame, setBoardGame] = useState(null);
  const [isExpansion, setIsExpansion] = useState(false);
  const [parentGameId, setParentGameId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { query, setQuery, results, loading } = useSearch("/api/search");

  const getBoardGamesFromBGG = async (e) => {
    e.preventDefault();
    try {
      const list = await fetchBggGames(input);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/boardgames/add", {
        method: "POST",
        body: JSON.stringify({ boardgame, parent_id: parentGameId }),
      });
      const { data } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${data}`} id={t.id} />);
        router.push("/admin/boardgames/upload")
      } else {
        toast.error(data);
        setBoardGame(null)
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl">Add Boardgame</h1>
      {!boardgame && (
        <form onSubmit={getBoardGamesFromBGG} className="mb-4">
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
