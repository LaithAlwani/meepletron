"use client";
import { useChat } from "ai/react";
export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <main className="min-h-screen flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <div className="flex flex-col w-full h-full max-w-md py-24 mx-auto stretch">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            {m.role === "user" ? "User: " : "AI: "}
            {m.content}
          </div>
        ))}

        <form onSubmit={handleSubmit}>
          <input
            className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
            value={input}
            placeholder="Say something..."
            onChange={handleInputChange}
          />
        </form>
      </div>
    </main>
  );
}
