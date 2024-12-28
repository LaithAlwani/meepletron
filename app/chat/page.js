"use client";
import { useChat } from "ai/react";
export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <>
      <div className=" justify-between  w-full  h-96 max-w-md ">
        <div>
          <div
            className={`  p-3 mb-3 max-w-96 rounded-lg  
              bg-green-400 ml-auto 
            `}>
            {"Hi, My Name is Jenna , How can I assisst you today?!"}
          </div>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`  p-3 mb-3 max-w-96 rounded-lg   bg-red-200 ${
                m.role != "user" ? "bg-green-400 ml-auto " : ""
              }`}>
              {m.role === "user" ? "User: " : "Jenna: "}
              {m.content}
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className=" w-full max-w-md ">
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
