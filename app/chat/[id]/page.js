"use client";
import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FcReading } from "react-icons/fc";
import { FaRegPaperPlane } from "react-icons/fa";

export default function ChatPage() {
  const params = useParams();
  const [boardgame, setBoardgame] = useState(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/chat/${params.id}`,
    body: { boardgame },
  });
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
    <section className="p-4">
      <div className="max-w-lg mx-auto justify-between w-full overflow-y-scroll no-scrollbar h-[78svh]  ">
        <img
          src={boardgame?.thumbnail}
          alt=""
          className="fixed top-2 right-2 w-16 h-16 rounded-md shadow-lg"
        />

        <div>
          {boardgame && (
            <div
              className={`p-3 mb-4 max-w-80 rounded-lg  
              bg-indigo-400 dark:bg-[#246199] shadow-md dark:shadow-cyan-900
            `}>
              <p>
                Hi I'm Jenna, Welcome to <strong className="uppercase">{boardgame?.title}! </strong>
                Ask me about the rules of the game!
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`mb-4 ${m.role === "user" ? " text-right" : ""}`}>
              <div
                className={`inline-block p-3 mb-3 min-w-24  max-w-[375px] rounded-md shadow-md  ${
                  m.role === "user"
                    ? " bg-indigo-200 dark:bg-indigo-600 text-left"
                    : " bg-indigo-400 dark:bg-[#246199] "
                }`}>
                <pre className="text-wrap font-serif">{m.content}</pre>
              </div>
            </div>
          ))}
          {isLoading && <FcReading size={48} />}
        </div>
      </div>
      <form onSubmit={handleSubmit} className=" w-full max-w-lg mx-auto">
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
    </section>
  );
}
