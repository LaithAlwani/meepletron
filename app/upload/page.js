"use client";
import { createBoardgame, fetchBggGame, fetchBoardGameBGG } from "@/lib/bgg-functions";
import { useState } from "react";

export default function UploadPage() {
  const [input, setInput] = useState("");
  const [gameList, setGameList] = useState([]);
  const [boardGame, setBoardGame] = useState(null);
  const [file, setFile] = useState(null);
  const [fileText, setText] = useState([]);

  const getBoardGames = async (e) => {
    e.preventDefault();
    const list = await fetchBggGame(input);
    if (list.length != undefined) {
      console.log(typeof list);
      setGameList(list);
    } else {
      const temp = [];
      temp.push(list);
      setGameList(temp);
    }
  };

  const getBoardGame = async (id, title) => {
    const bg = await fetchBoardGameBGG(id);
    const boardgame = createBoardgame(bg, title);
    setBoardGame(boardgame);
    setGameList([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("file", file);
    for (var key in boardGame) {
      data.append(key, boardGame[key]);
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: data,
    });
    if (res.ok) {
      const { data } = await res.json();
      data.forEach((chunk) => (chunk.pageContent = cleanText(chunk.pageContent)));
      setText(data);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {!boardGame && !gameList?.length && (
        <form onSubmit={getBoardGames}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} />
          <button>get games</button>
        </form>
      )}

      {gameList.length > 0 &&
        gameList?.map((game) => (
          <p key={game["@_id"]} onClick={() => getBoardGame(game["@_id"], game.name["@_value"])}>
            {game.name["@_value"]}
          </p>
        ))}
      {boardGame && (
        <>
          <img src={boardGame.thumbnail} alt={boardGame.title} />
          <p>{boardGame.title}</p>
        </>
      )}
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
        <button>upload</button>
      </form>

      {fileText?.map((text, idx) => (
        <pre key={idx} className="max-w-xl">
          {console.log(text.metadata)}
          <details>
            <summary className="text-xl font-bold">Page:{text.metadata.loc.pageNumber}</summary>
            {text.pageContent}
          </details>
          
        </pre>
      ))}
    </div>
  );
}
