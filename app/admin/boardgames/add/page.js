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
  const [parentGame, setParentGame] = useState("");
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
      if (boardgame.is_expansion) {
        //get parent game to make it's correct
        const parent_bg = await fetchBoardGameBGG(boardgame.parent_bgg_Id);
        const parent = createBoardgame(parent_bg, title);
        
        setParentGame(parent);
      }
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
        body: JSON.stringify({ boardgame }),
      });
      const { data } = await res.json();
      if (res.ok) {
        toast.custom((t) => <CustomToast message={`${data}`} id={t.id} />);
        // router.push("/admin/boardgames/upload");
      } else {
        toast.error(data);
        setBoardGame(null);
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
        <div className="flex justify-between mt-4">
          <div>
            <h3 className="text-lg font-semibold">Selected Game</h3>
            <img src={boardgame.thumbnail} alt={boardgame.title} className="w-32 rounded" />
            <p className="font-bold text-lg">{boardgame.title}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Parent Game</h3>
            <img src={parentGame.thumbnail} alt="" />
          </div>
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
