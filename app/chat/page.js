"use client";
import { useChat } from "ai/react";
export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <>
      <div className=" justify-between w-full overflow-y-scroll p-2 pt-5 h-[100svh]  ">
        <div>
          <div
            className={`p-3 mb-3 max-w-72 rounded-lg  
              bg-red-500 ml-auto text-black
            `}>
            <strong className="block">Jenna</strong>

            {"Hi, My Name is Jenna , How can I assisst you today?!"}
          </div>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 mb-3 max-w-72 rounded-lg text-black  ${
                m.role === "user" ? " bg-amber-600" : " bg-red-500 ml-auto"
              }`}>
              <strong className="block">{m.role === "user" ? "You " : "Jenna "}</strong>
              {m.content}
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className=" w-full max-w-md mx-auto">
        <input
          className=" w-full p-2 mb-8 border border-gray-700 rounded shadow-xl"
          value={input}
          placeholder="Ask a board game rules question..."
          onChange={handleInputChange}
        />
      </form>
    </>
  );
}
