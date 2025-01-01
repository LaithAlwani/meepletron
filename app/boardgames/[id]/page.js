'use client'
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function BoardgamePage() {
  const params = useParams();
  const [boardgame, setBoardgame] = useState(null);
  
  const getBoardgame = async () => {
    const res = await fetch(`/api/boardgame/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setBoardgame(data);
    }
  };
  useEffect(() => {
    getBoardgame();
  }, []);
  return <div>
    {boardgame && <h2>{boardgame.title}</h2>}
  </div>;
}
