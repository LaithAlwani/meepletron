"use client";
import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaPaperPlane, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { BsLayers } from "react-icons/bs";
import { IoArrowBack, IoClose } from "react-icons/io5";
import { FaArrowDown } from "react-icons/fa";
import Loader from "@/components/Loader";
import TypingIndicator from "@/components/TypingDots";
import Link from "next/link";
import { Textarea } from "@/components/ui";
import toast from "react-hot-toast";
import CustomToast from "@/components/CustomeToast";
import { useUser } from "@clerk/nextjs";
import { generateId } from "ai";
import { useRouter } from "next/navigation";

// ─── Guest localStorage helpers ───────────────────────────────────────────────

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function guestKey(boardgameId) {
  return `meepletron_guest_${boardgameId}`;
}

function loadGuestMessages(boardgameId) {
  try {
    const raw = localStorage.getItem(guestKey(boardgameId));
    if (!raw) return [];
    const { expiresAt, messages } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(guestKey(boardgameId));
      return [];
    }
    return messages;
  } catch {
    return [];
  }
}

function saveGuestMessages(boardgameId, messages, game) {
  try {
    const key = guestKey(boardgameId);
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(
      key,
      JSON.stringify({
        expiresAt: existing.expiresAt ?? Date.now() + EXPIRY_MS,
        game: game ?? existing.game,
        messages,
      })
    );
  } catch {}
}

// ─── Page component ────────────────────────────────────────────────────────────

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [chat, setChat] = useState(null);
  const [boardgame, setBoardgame] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    body: { boardgame_id: currentGame?._id, boardgame_title: currentGame?.title },
    onFinish: (message) => {
      if (user) {
        saveMessage(message.id, message.role, message.content, message.annotations);
      }
    },
  });

  // ─── Data fetching ────────────────────────────────────────────────────────

  const getBoardgame = async () => {
    setBoardgame(null);
    setCurrentGame(null);
    try {
      const res = await fetch(`/api/boardgames/${params.id}`);
      if (res.ok) {
        const { data } = await res.json();
        setBoardgame(data);
        setCurrentGame(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getChat = async (game) => {
    setMessages([]);
    try {
      const res = await fetch(`/api/boardgames/${game._id}/chat`);
      const { data, message } = await res.json();
      if (!res.ok) throw new Error(message);

      if (Object.keys(data.chat).length === 0) {
        const createRes = await fetch(`/api/boardgames/${game._id}/chat`, {
          method: "POST",
          body: JSON.stringify({
            user_id: user?.id,
            boardgame_id: game._id,
            parent_id: game.parent_id,
          }),
        });
        const { data: newChat, message: createMsg } = await createRes.json();
        if (!createRes.ok) throw new Error(createMsg);
        toast.custom((t) => <CustomToast message={createMsg} id={t.id} />);
        setChat(newChat);
      } else {
        setChat(data.chat);
        setMessages(data.messages);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveMessage = async (id, role, content, annotations) => {
    if (!id || !role || !content || !chat?._id) return;
    try {
      const res = await fetch("/api/chat/save-message", {
        method: "POST",
        body: JSON.stringify({
          _id: id,
          chat_id: chat._id,
          role,
          content,
          annotations,
          parent_id: currentGame?.parent_id,
        }),
      });
      const { message } = await res.json();
      if (!res.ok) throw new Error(message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ─── Scroll handling ──────────────────────────────────────────────────────

  const handleScroll = (e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    setIsAtBottom(scrollHeight - scrollTop - 5 <= clientHeight);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // ─── Submit handler ───────────────────────────────────────────────────────

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const id = generateId();
    const currentInput = input;
    if (user && currentGame && chat) saveMessage(id, "user", currentInput);
    if (inputRef.current) inputRef.current.style.height = "auto";
    handleSubmit();
  };

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    getBoardgame();
  }, []);

  useEffect(() => {
    if (user && currentGame) getChat(currentGame);
  }, [currentGame, user]);

  useEffect(() => {
    if (isLoaded && !user && currentGame) {
      setMessages(loadGuestMessages(currentGame._id));
    }
  }, [currentGame, isLoaded, user]);

  useEffect(() => {
    if (!user && isLoaded && !isLoading && messages.length > 0 && currentGame) {
      saveGuestMessages(currentGame._id, messages, {
        _id: currentGame._id,
        title: currentGame.title,
        thumbnail: currentGame.thumbnail,
      });
    }
  }, [isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!boardgame) return <Loader height="h-screen" />;

  const expansionCount = boardgame.expansions?.length ?? 0;

  return (
    <section className="h-[100svh] flex flex-col">
      {/* Header */}
      <nav className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-slate-300 shrink-0">
          <IoArrowBack size={18} />
        </button>

        <Link
          href={`/boardgames/${currentGame?.parent_id ?? currentGame?._id}${
            currentGame?.parent_id ? `/expansions/${currentGame._id}` : ""
          }`}
          className="flex items-center gap-2.5 flex-1 min-w-0 group">
          <img
            src={currentGame?.thumbnail}
            alt={currentGame?.title}
            className="h-9 w-9 rounded-xl object-cover shrink-0 shadow-sm"
          />
          <div className="min-w-0">
            <h2 className="capitalize font-semibold text-sm truncate text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-yellow-400 transition-colors">
              {currentGame?.title}
            </h2>
            {currentGame?.parent_id && (
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">Expansion</p>
            )}
          </div>
        </Link>

        {/* Expansions button — always visible */}
        <button
          onClick={() => setSideNavOpen(true)}
          className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-slate-400 shrink-0 flex flex-col items-center gap-0.5">
          <BsLayers size={18} />
          <span className="text-[10px] font-medium leading-none">
            {expansionCount > 0 ? `${expansionCount}` : "EXP"}
          </span>
        </button>
      </nav>

      {/* Guest banner */}
      <AnimatePresence>
        {isLoaded && !user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 overflow-hidden">
            <div className="text-center text-xs py-2 px-4 bg-amber-50 dark:bg-yellow-500/10 border-b border-amber-200 dark:border-yellow-500/20 text-amber-700 dark:text-yellow-400">
              <Link href="/sign-in" className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">
                Sign in
              </Link>{" "}
              to save your chat history permanently · Guest history kept for 30 days
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto hide-scrollbar py-4">
        <div className="max-w-xl mx-auto px-4">

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 pt-10 pb-6 text-center px-6">
            <div className="relative">
              <img
                src={currentGame?.thumbnail}
                alt={currentGame?.title}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg"
              />
              <img
                src="/logo.webp"
                alt="Meepletron"
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-2 border-white dark:border-slate-900 shadow object-contain bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">
                {currentGame?.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                Ask me anything about the rules,<br className="hidden sm:block" /> setup, or strategy.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {["How do I set up the game?", "What are the win conditions?", "How does turn order work?"].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    handleInputChange({ target: { value: q } });
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-yellow-500/50 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <Message key={message._id || message.id} message={message} user={user} />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-end gap-2">
                <img
                  src="/logo.webp"
                  alt="logo"
                  className="w-7 h-7 object-contain rounded-full shrink-0 border border-gray-100 dark:border-slate-700"
                />
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {!isAtBottom && (
          <motion.button
            key="scroll-btn"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            onClick={scrollToBottom}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 rounded-full p-2.5 text-gray-500 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors z-10">
            <FaArrowDown size={13} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input form */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <form
          onSubmit={onSubmit}
          className="max-w-xl mx-auto flex items-end gap-2 bg-gray-100 dark:bg-slate-800 rounded-2xl px-3 py-2 ring-1 ring-gray-200 dark:ring-slate-700 focus-within:ring-blue-400 dark:focus-within:ring-yellow-500 transition-all">
          <Textarea
            placeholder="Ask Meepletron…"
            rows="1"
            ref={inputRef}
            value={input}
            disabled={isLoading}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 p-2.5 rounded-xl bg-blue-600 dark:bg-yellow-500 text-white dark:text-slate-900 hover:bg-blue-700 dark:hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            <FaPaperPlane size={13} />
          </button>
        </form>
      </div>

      {/* Expansion side nav */}
      <AnimatePresence>
        {sideNavOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSideNavOpen(false)}
              className="fixed inset-0 bg-black/40 z-10 backdrop-blur-[1px]"
            />
            <motion.aside
              key="sidenav"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 w-72 h-full bg-white dark:bg-slate-900 z-20 shadow-2xl flex flex-col">

              {/* Side nav header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Game Selector</h3>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    Switch between base game &amp; expansions
                  </p>
                </div>
                <button
                  onClick={() => setSideNavOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-500 dark:text-slate-400">
                  <IoClose size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Base game section */}
                <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  Base Game
                </p>
                <ListItem
                  game={boardgame}
                  currentGame={currentGame}
                  setCurrentGame={setCurrentGame}
                  setSideNavOpen={setSideNavOpen}
                />

                {/* Expansions section */}
                <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 mt-2">
                  Expansions
                  {expansionCount > 0 && (
                    <span className="ml-1.5 bg-blue-100 dark:bg-yellow-500/20 text-blue-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                      {expansionCount}
                    </span>
                  )}
                </p>

                {expansionCount > 0 ? (
                  boardgame.expansions.map((exp) => (
                    <ListItem
                      key={exp._id}
                      game={exp}
                      currentGame={currentGame}
                      setCurrentGame={setCurrentGame}
                      setSideNavOpen={setSideNavOpen}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                    <BsLayers size={28} className="text-gray-300 dark:text-slate-600" />
                    <p className="text-sm font-medium text-gray-400 dark:text-slate-500">No expansions yet</p>
                    <p className="text-xs text-gray-300 dark:text-slate-600">
                      Expansions will appear here once they're added.
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const ListItem = ({ game, currentGame, setCurrentGame, setSideNavOpen }) => {
  const isActive = currentGame?._id === game?._id;
  return (
    <li
      onClick={() => {
        setCurrentGame(game);
        setSideNavOpen(false);
      }}
      className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all capitalize text-sm font-medium list-none ${
        isActive
          ? "bg-blue-500 dark:bg-yellow-500 text-white dark:text-slate-900 shadow-sm"
          : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
      }`}>
      <img src={game?.thumbnail} alt={game?.title} className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
      <span className="truncate">{game?.title}</span>
      {isActive && (
        <span className="ml-auto text-[10px] font-semibold opacity-80 shrink-0">Active</span>
      )}
    </li>
  );
};

const Message = ({ message, user }) => {
  const { _id, id, role, content, rating, annotations } = message;
  const isUser = role === "user";

  // Don't render an empty AI bubble — the TypingIndicator covers the "thinking" state
  if (!isUser && !content) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <img
          src="/logo.webp"
          alt="Meepletron"
          className="w-7 h-7 object-contain rounded-full shrink-0 mb-1 border border-gray-100 dark:border-slate-700"
        />
      )}

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-blue-600 text-white dark:bg-yellow-500 dark:text-slate-900 rounded-br-md shadow-sm"
              : "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm ring-1 ring-gray-200/60 dark:ring-slate-700/60"
          }`}>
          {content}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2.5 px-1">
            {annotations?.[0]?.url && (
              <a
                href={annotations[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-50 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600 text-blue-600 dark:text-slate-300 px-2.5 py-1 rounded-full transition-colors border border-blue-100 dark:border-slate-600">
                📄 Source
              </a>
            )}
            <RateMessage id={_id || id} existingRating={rating} user={user} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const RateMessage = ({ id, existingRating, user }) => {
  const [rating, setRating] = useState(existingRating || "");

  const rateMessage = async (newRating) => {
    if (!user) return toast.error("Sign in to rate messages");
    setRating(newRating);
    const res = await fetch("/api/chat/rate-message", {
      method: "POST",
      body: JSON.stringify({ id, rating: newRating }),
    });
    const { message } = await res.json();
    if (!res.ok) {
      setRating(existingRating || "");
      return toast.error("Failed to save rating");
    }
    toast.custom((t) => <CustomToast message={message} id={t.id} />, { duration: 1500 });
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => rateMessage("wrong")}
        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
        <FaThumbsDown
          size={12}
          className={rating === "wrong" ? "text-red-500" : "text-gray-300 dark:text-slate-600"}
        />
      </button>
      <button
        onClick={() => rateMessage("correct")}
        className="p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-500/10 transition-all">
        <FaThumbsUp
          size={12}
          className={rating === "correct" ? "text-green-500" : "text-gray-300 dark:text-slate-600"}
        />
      </button>
    </div>
  );
};
