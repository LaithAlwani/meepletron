"use client";
import { useChat } from "ai/react";
import { FcReading } from "react-icons/fc";
export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <>
      <div className=" justify-between w-full overflow-y-scroll no-scrollbar pt-5 h-[85svh]  ">
        <div>
          <div
            className={`p-3 mb-3 max-w-72 rounded-lg  
              bg-[--bubble-ai] ml-auto shadow-md
            `}>
            <strong className="block">Jenna</strong>

            {"Hi, My Name is Jenna , How can I assisst you today?!"}
          </div>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3 mb-3 max-w-72 rounded-lg shadow-lg ${
                m.role === "user" ? " bg-[--bubble-user]" : " bg-[--bubble-ai] ml-auto"
              }`}>
              <strong className="block">{m.role === "user" ? "You " : "Jenna "}</strong>
              {m.content}
            </div>
          ))}
          {isLoading && <FcReading size={48} />}
        </div>
      </div>
      <form onSubmit={handleSubmit} className=" w-full max-w-md mx-auto">
        <input
          className=" w-full p-2 border-t focus:outline-0 border-gray-700  "
          value={input}
          placeholder="Ask a board game rules question..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </form>
    </>
  );
}
