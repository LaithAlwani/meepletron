"use client";
import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FcReading } from "react-icons/fc";
import { FaRegPaperPlane } from "react-icons/fa";
import Loader from "@/components/Loader";
import TypingIndicator from "@/components/TypingDots";

export default function ChatPage() {
  const params = useParams();
  const [boardgame, setBoardgame] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/chat/${params.id}`,
    body: { boardgame },
  });

  const getBoardgame = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boardgame/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBoardgame(data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBoardgame();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current?.scrollHeight;
    }
  }, [messages]);
  return !loading ? (
    <section className="p-4">
      <div
        ref={messagesEndRef}
        className=" max-w-lg mx-auto justify-between w-full overflow-y-scroll no-scrollbar h-[76svh]  ">
        <img
          src={boardgame?.image}
          alt=""
          className="block mx-auto max-w-[200px] max-auto rounded-md shadow-lg mb-5"
        />
        <h2 className="text-xl font-bold capitalize text-center mb-5">{boardgame?.title}</h2>

        <div className="overflow-y-auto">
          {boardgame && (
            <div
              className={`p-3 mb-4 max-w-80 rounded-lg  
              bg-indigo-400 dark:bg-[#246199] shadow-md dark:shadow-cyan-900
            `}>
              <p>
                Hi welcome to <strong>{boardgame.title}</strong>!<br />
                How can I assisst?!
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
          {isLoading && (
            <span className="flex items-end gap-2">
              <FcReading size={48} /> <TypingIndicator />
            </span>
          )}
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
  ) : (
    <Loader />
  );
}
