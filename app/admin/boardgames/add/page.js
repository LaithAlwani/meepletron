"use client";
import { useState, useRef } from "react";

import { useSearch } from "@/utils/hooks";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import CustomToast from "@/components/CustomeToast";
import CustomButton from "@/components/CustomeButton";
import Loader from "@/components/Loader";

export default function AddBoardgame() {
  const [input, setInput] = useState("");
  const [gameList, setGameList] = useState([]);
  const [boardgame, setBoardGame] = useState(null);
  const [parentGame, setParentGame] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  

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
      <form onSubmit={handleSubmit}>
        <input type="text"  placeholder="title"/>
        <input type="text"  placeholder="image"/>
        <input type="text"  placeholder="thumbnail"/>
        <input type="number"  placeholder="max players"/>
        <input type="number"  placeholder="min players"/>
        <input type="number" placeholder="play time" />
        <input type="number" placeholder="min age" />
        <CustomButton>Submit</CustomButton>
      </form>

      
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
