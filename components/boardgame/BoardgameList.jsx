"use client";
import React, { useEffect, useState } from "react";
import BoardgameContainer from "./BoardgameContainer";

export default function BoardgameList() {
  const [boardgames, setBoardgames] = useState([]);

  const getBoardgames = async () => {
    const res = await fetch(`/api/boardgames`)
    if (res.ok) {
      const { data } = await res.json();
      setBoardgames(data);
    }
  }
  useEffect(() => {
    getBoardgames();
  },[])
  return boardgames?.map((boardgame) => (
    <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
  ));
}
