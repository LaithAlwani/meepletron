"use client";
import React, { useEffect, useState } from "react";
import BoardgameContainer from "./BoardgameContainer";
import toast from "react-hot-toast";

const BoardgameSkeleton = () => {
  return (
    <div className="flex flex-wrap justify-center gap-4"> {/* Adjust gap as needed */}
      {[...Array(8)].map((_, i) => ( // Render 8 skeletons (adjust as needed)
        <div key={i} className="w-[11rem] h-[11rem] bg-gray-200 animate-pulse rounded"></div> // Adjust size
      ))}
    </div>
  );
};

export default function BoardgameList() {
  const [boardgames, setBoardgames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getBoardgames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/boardgames`);
      const { data, message } = await res.json();
      if (!res.ok) return toast.error(message);

      setBoardgames(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBoardgames();
  }, []);

  return (
    <>
      {isLoading ? (
        <BoardgameSkeleton />
      ) : boardgames.length === 0 ? ( // Check for empty array AFTER loading
        <p>No boardgames found.</p>
      ) : (
        boardgames.map((boardgame) => (
          <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
        ))
      )}
    </>
  );
}