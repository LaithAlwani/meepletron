"use client";

import { useState } from "react";
import { FaHeart } from "react-icons/fa";

export default function FavoriteButton({ userId, boardGameId }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const toggleFavorite = async () => {
    try {
      
      // const res = await fetch("/api/favorites", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ userId, boardGameId }),
      // });

      
        setIsFavorited(!isFavorited);
      
      
    } catch (error) {
      console.error("Error while toggling favorite:", error);
    }
  };

  return (
    <span
      onClick={toggleFavorite}
      className={`p-2 rounded-full ${
        isFavorited ? "text-red-500" : "text-gray-600"
      }`}
      aria-label="Favorite"
    >
      <FaHeart size={32} className={ `   ${isFavorited ? "currentColor" : "none"}`} />
    </span>
  );
}