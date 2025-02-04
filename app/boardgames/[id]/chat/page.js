"use client";
import { useChat } from "ai/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FcReading } from "react-icons/fc";
import { FaRegPaperPlane, FaMicrophone } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoArrowBack } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import Loader from "@/components/Loader";
import TypingIndicator from "@/components/TypingDots";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const [boardgame, setBoardgame] = useState(null);
  const [expansions, setExpansions] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/chat/${params.id}`,
    body: { boardgame: currentGame },
  });

  const getBoardgame = async () => {
    setLoading(true);
    setBoardgame(null);
    setExpansions([]);
    setCurrentGame(null);
    try {
      const res = await fetch(`/api/boardgames/${params.id}`);
      if (res.ok) {
        const { data } = await res.json();
        setBoardgame(data.boardgame);
        setExpansions(data.expansions);
        setCurrentGame(data.boardgame);
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

  return boardgame && !loading ? (
    <section className="h-[100svh] flex flex-col justify-evenly px-4 max-w-xl mx-auto">
      <nav className="flex items-center justify-start gap-4 py-4 ">
        <button onClick={() => router.back()} className="text-xl">
          <IoArrowBack />
        </button>
        {currentGame && (
          <Link href={`/boardgames/${currentGame._id}`} className="flex items-center gap-2 ">
            <img
              src={currentGame?.thumbnail}
              alt={currentGame?.title}
              className="w-12 rounded-md"
            />
            <h2 className="capitalize font-semibold text-nowrap text-ellipsis overflow-hidden">
              {currentGame?.title}
            </h2>
          </Link>
        )}
        {expansions.length > 0 && (
          <button onClick={() => setSideNavOpen(!sideNavOpen)} className="text-xl ml-auto">
            <BsThreeDotsVertical />
          </button>
        )}
      </nav>
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: sideNavOpen ? "0%" : "100%" }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 right-0 w-72 h-full bg-gray-100 dark:bg-slate-950  ">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold p-2">Select a Game</h3>
          <button onClick={() => setSideNavOpen(false)} className="text-xl">
            <IoClose />
          </button>
        </div>
        <ul className="mt-4">
          <ListItem
            game={boardgame}
            currentGame={currentGame}
            setCurrentGame={setCurrentGame}
            setSideNavOpen={setSideNavOpen}
          />

          {expansions.map((exp) => (
            <ListItem
              key={exp._id}
              game={exp}
              currentGame={currentGame}
              setCurrentGame={setCurrentGame}
              setSideNavOpen={setSideNavOpen}
            />
          ))}
        </ul>
      </motion.aside>
      <div
        ref={messagesEndRef}
        className="flex-1 max-w-xl mx-auto justify-between w-full overflow-y-scroll no-scrollbar ">
        <div className="overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className={`mb-4 ${m.role === "user" ? "text-right" : ""}`}>
              <div
                className={`inline-block p-3 mb-3 min-w-24 max-w-[375px] rounded-md shadow-md ${
                  m.role === "user"
                    ? "bg-indigo-200 dark:bg-indigo-600 text-left"
                    : "bg-indigo-400 dark:bg-[#246199]"
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
      <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto py-4">
        <div className="flex items-center w-full border border-gray-700 rounded-lg p-2">
          {/* <input
            className="w-full focus:outline-0 bg-inherit"
            value={input}
            placeholder="Ask a board game rules question..."
            onChange={handleInputChange}
            disabled={isLoading}
          /> */}
          <textarea
            placeholder="Ask a question..."
            className="w-full  bg-transparent focus:outline-none resize-none lib"
            rows="1"
            value={input}
            onChange={handleInputChange}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />

          <button className="cursor-pointer mx-2" disabled>
            <FaMicrophone className="text-slate-500 cursor-not-allowed" />
          </button>
          <button type="submit" className="cursor-pointer">
            <FaRegPaperPlane />
          </button>
        </div>
      </form>
    </section>
  ) : (
    <Loader height="h-screen" />
  );
}

const ListItem = ({ game, currentGame, setCurrentGame, setSideNavOpen }) => {
  return (
    <li
      key={game?._id}
      className={`capitalize p-2 border-b cursor-pointer  ${
        currentGame?._id === game?._id
          ? "bg-indigo-500 text-white font-semibold dark:bg-yellow-500 dark:text-slate-800"
          : ""
      }`}
      onClick={() => {
        setCurrentGame(game);
        setSideNavOpen(false);
      }}>
      {game?.title}
    </li>
  );
};
