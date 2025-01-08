"use client";
import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FcReading } from "react-icons/fc";
import { FaRegPaperPlane } from "react-icons/fa";

export default function ChatPage() {
  const params = useParams();
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/chat/${params.id}`,
  });
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
  return (
    <>
      <div className=" justify-between w-full overflow-y-scroll no-scrollbar pt-5 h-[85svh]  ">
        <div>
          {boardgame && (
            <div
              className={`p-3 mb-4 max-w-72 rounded-lg  
              bg-[--bubble-ai] shadow-md 
            `}>
              <p>
                Hi I'm Jenna, Welcome to <strong className="uppercase">{boardgame?.title}</strong> <br />
                Ask me about the rules of the game!
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`mb-4 ${m.role === "user" ? " text-right" : ""}`}>
              <div
                className={`inline-block p-3 mb-3 min-w-24 max-w-sm rounded-lg shadow-lg ${
                  m.role === "user" ? " bg-[--bubble-user] text-left" : " bg-[--bubble-ai] "
                }`}>
                <pre className="text-wrap font-serif">{m.content}</pre>
              </div>
            </div>
          ))}
          {isLoading && <FcReading size={48} />}
        </div>
      </div>
      <form onSubmit={handleSubmit} className=" w-full max-w-md mx-auto">
        <div className="flex items-center w-full border border-gray-700 rounded p-2">
          <input
            className="w-full focus:outline-0  bg-inherit"
            value={input}
            placeholder="Ask a board game rules question..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button className="cursor-pointer">
            <FaRegPaperPlane />
          </button>
        </div>
      </form>
    </>
  );
}
