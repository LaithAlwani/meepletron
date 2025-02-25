"use client";
import { useChat } from "ai/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FcReading } from "react-icons/fc";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoArrowBack } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import Loader from "@/components/Loader";
import TypingIndicator from "@/components/TypingDots";
import Link from "next/link";
import { Button, Textarea } from "@/components/ui";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { useUser } from "@clerk/nextjs";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [chat, setChat] = useState(null);
  const [boardgame, setBoardgame] = useState(null);
  const [expansions, setExpansions] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    body: { boardgame_id: currentGame?._id, boardgame_title: currentGame?.title },
  });

  const testSubmit = (e) => {
    e.preventDefault();
    handleSubmit();
    
  };

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
  const getChat = async () => {
    if (!currentGame?._id || !user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boardgames/${currentGame?._id}/chat`);
      const {
        data: { chat, message },
      } = await res.json();
      if (!res.ok) return toast.error(message);
      if (Object.keys(chat).length === 0) {
        //create a new chat
        const res = await fetch(`/api/boardgames/${currentGame?._id}/chat`, {
          method: "POST",
          body: JSON.stringify({ user_id: user?.id, boardgame_id: currentGame?._id }),
        });
        const { data, message } = await res.json();
        if (!res.ok) return toast.error(message);
        toast.custom((t) => <CustomToast message={message} id={t.id} />);
        setChat(data);
        
      } else {
        //set the chat.
        setChat(chat);
        console.log(chat)
        //set messages to intial messages
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBoardgame();
  }, []);

  useEffect(() => {
    getChat();
  }, [currentGame]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current?.scrollHeight;
    }
  }, [messages]);

  return boardgame && !loading ? (
    <section className="h-[100svh] flex flex-col justify-evenly px-4 max-w-xl mx-auto">
      <nav className="flex items-center justify-start gap-4 py-4 ">
        <Link href="/chats" className="text-xl cursor-pointer">
          <IoArrowBack />
        </Link>
        {currentGame && (
          <Link href={`/boardgames/${currentGame._id}`} className="flex items-center gap-2 ">
            <img
              src={currentGame?.thumbnail}
              alt={currentGame?.title}
              className="h-12 rounded-md"
            />
            <h2 className="capitalize font-semibold truncate">{currentGame?.title}</h2>
          </Link>
        )}
        {expansions.length > 0 && (
          <span
            onClick={() => setSideNavOpen(!sideNavOpen)}
            className="cursor-pointer text-xl ml-auto">
            <BsThreeDotsVertical />
          </span>
        )}
      </nav>
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: sideNavOpen ? "0%" : "100%" }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 right-0 w-72 h-full bg-gray-100 dark:bg-slate-950  ">
        <div className="flex justify-between items-center p-2">
          <h3 className="text-xl font-bold ">Select a Game</h3>
          <span onClick={() => setSideNavOpen(false)} className="text-xl p-2 cursor-pointer">
            <IoClose />
          </span>
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
        className="flex-1 max-w-xl mx-auto justify-between w-full overflow-y-scroll hide-scrollbar ">
        <div className="overflow-y-auto">
          {messages.map((m) => (
            <div key={m._id || m.id} className={`mb-4 ${m.role === "user" ? "text-right" : ""}`}>
              <div
                className={`inline-block p-3 mb-3 min-w-24 max-w-[375px] rounded-md shadow-md ${
                  m.role === "user"
                    ? "bg-blue-200 dark:bg-blue-600 text-left"
                    : "bg-blue-400 dark:bg-[#246199]"
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
      <form onSubmit={testSubmit} className="flex items-end gap-2 w-full max-w-xl mx-auto py-4">
        <Textarea
          placeholder="Ask Meepletron"
          rows="1"
          value={input}
          disabled={isLoading}
          onChange={handleInputChange}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
        
        <Button type="submit" styles="w-auto rounded-full py-4">
          <FaPaperPlane />
        </Button>

        {/* {!input.trim() ? (
          <Button styles="w-auto rounded-full py-4">
            <FaMicrophone  className="text-slate-400 cursor-not-allowed " />
          </Button>
        ) : (
          <Button type="submit" styles="w-auto rounded-full py-4">
          <FaPaperPlane />
        </Button>
        )} */}
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
          ? "bg-blue-500 text-white font-semibold dark:bg-yellow-500 dark:text-slate-800"
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
