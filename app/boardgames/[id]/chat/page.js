"use client";
import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoArrowBack } from "react-icons/io5";
import { FaArrowDown } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import Loader from "@/components/Loader";
import TypingIndicator from "@/components/TypingDots";
import Link from "next/link";
import { Button, Textarea } from "@/components/ui";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { LuCheck, LuCheckCheck } from "react-icons/lu";
import { MdOutlineClose } from "react-icons/md";
import { Six_Caps } from "next/font/google";
import { generateId } from "ai";

export default function ChatPage() {
  const params = useParams();
  const { user } = useUser();
  const [chat, setChat] = useState(null);
  const [boardgame, setBoardgame] = useState(null);
  const [expansions, setExpansions] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const inputRef = useRef();
  const messagesEndRef = useRef(null);
  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    body: { boardgame_id: currentGame?._id, boardgame_title: currentGame?.title },
    onFinish: (message) => saveMessage(message.id, message.role, message.content),
  });

  const getBoardgame = async () => {
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
    }
  };
  const getChat = async (currentGame) => {
    setMessages([]);
    try {
      const res = await fetch(`/api/boardgames/${currentGame?._id}/chat`);
      const {
        data: { chat, messages, message },
      } = await res.json();
      if (!res.ok) return toast.error(message);
      if (Object.keys(chat).length === 0) {
        //create a new chat
        const res = await fetch(`/api/boardgames/${currentGame?._id}/chat`, {
          method: "POST",
          body: JSON.stringify({
            user_id: user?.id,
            boardgame_id: currentGame?._id,
            parent_id: currentGame?.parent_id,
          }),
        });
        const { data, message } = await res.json();
        if (!res.ok) return toast.error(message);
        toast.custom((t) => <CustomToast message={message} id={t.id} />);
        setChat(data);
      } else {
        setChat(chat);
        setMessages(messages);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveMessage = async (id, role, content) => {
    if (!id || !role || !content ||!chat._id) return toast.error("message missing parameter");
    const newMessage = {
      _id: id,
      chat_id: chat._id,
      role,
      content,
      parent_id: currentGame.parent_id,
    };
    try {
      const res = await fetch("/api/chat/save-message", {
        method: "POST",
        body: JSON.stringify(newMessage),
      });
      const { message } = await res.json();
      if (!res.ok) return toast.error(message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop - 5 <= e.target.clientHeight;
    if (bottom) setIsAtBottom(true);
    else setIsAtBottom(false);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current?.scrollHeight;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const id = generateId();
    currentGame && chat && saveMessage(id, "user", input);
    inputRef.current.style.height = "auto";
    handleSubmit();
  };

  useEffect(() => {
    getBoardgame();
  }, []);

  useEffect(() => {
    if (currentGame) getChat(currentGame); //TODO:chek for user after beta
  }, [currentGame, user]);

  // scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return boardgame ? (
    <section className="h-[100svh] flex flex-col justify-evenly px-4 max-w-xl mx-auto">
      <nav className="flex items-center gap-2 py-4">
        <Link href="/chats" className="text-lg cursor-pointer">
          <IoArrowBack />
        </Link>
        {currentGame && (
          <Link href={`/boardgames/${currentGame._id}`} className="flex items-center gap-2">
            <img
              src={currentGame?.thumbnail}
              alt={currentGame?.title}
              className="h-10 rounded-md"
            />
            <h2 className="font-semibold">{currentGame?.title}</h2>
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
        onScroll={handleScroll}
        className="flex-1 max-w-xl mx-auto justify-between w-full overflow-y-scroll hide-scrollbar ">
        <div className="overflow-y-auto">
          {messages.map((message) => (
            <Message key={message._id || message.id} message={message} />
          ))}
          {isLoading && (
            <span className="flex items-end gap-2">
              <span className="relative w-12 h-12">
                <Image
                  src="/logo.webp"
                  alt="logo"
                  fill
                  priority
                  quality={50}
                  style={{ objectFit: "contain" }}
                />
              </span>
              <TypingIndicator />
            </span>
          )}
        </div>
      </div>

      {!isAtBottom && (
        <Button
          onClick={scrollToBottom}
          styles="fixed bottom-16 py-4 left-1/2 -translate-x-1/2 opacity-75 w-auto rounded-full">
          <FaArrowDown />
        </Button>
      )}
      <form onSubmit={onSubmit} className="flex items-end gap-2 w-full max-w-xl mx-auto py-4">
        <Textarea
          placeholder="Ask Meepletron"
          rows="1"
          ref={inputRef}
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

const Message = ({ message }) => {
  const { _id, id, role, content, rating } = message;
  return (
    <div className={`mb-4 ${role === "user" ? "text-right" : ""}`}>
      <div
        className={`relative inline-block p-3 min-w-24 max-w-[375px] rounded-md shadow-md ${
          role === "user"
            ? "bg-blue-200 dark:bg-blue-600 text-left"
            : "bg-blue-400 dark:bg-[#246199]"
        }`}>
        <pre className="text-wrap font-serif">{content}</pre>
        {role === "assistant" && <RateMessage id={_id || id} exisitingRating={rating} />}
      </div>
    </div>
  );
};

const RateMessage = ({ id, exisitingRating }) => {
  const size = 22;
  const [rating, setRating] = useState(exisitingRating || "");

  const rateMessage = async (rating) => {
    setRating(rating);
    const res = await fetch("/api/chat/rate-message", {
      method: "POST",
      body: JSON.stringify({ id, rating }),
    });
    const { message } = await res.json();
    if (!res.ok) {
      setRating("");
      return toast.error("failed to save rating");
    }
    toast.custom((t) => <CustomToast message={message} id={t.id} />, { duration: 250 });
  };
  return (
    <div className="flex justify-end gap-1 pt-6 ">
      <MdOutlineClose
        size={size}
        className={`${rating === "wrong" ? "text-red-500" : ""}`}
        onClick={() => rateMessage("wrong")}
      />
      |
      <LuCheck
        size={size}
        className={`${rating === "partial" ? "text-green-500" : ""}`}
        onClick={() => rateMessage("partial")}
      />
      |
      <LuCheckCheck
        size={size}
        className={`${rating === "correct" ? "text-green-500" : ""}`}
        onClick={() => rateMessage("correct")}
      />
    </div>
  );
};
