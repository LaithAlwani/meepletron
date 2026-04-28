"use client";
import { useChat } from "ai/react";
import { useParams } from "next/navigation";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaPaperPlane, FaThumbsUp, FaThumbsDown, FaCheck } from "react-icons/fa";
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
import ThemeSwitch from "@/components/ThemeSwitch";
import { generateId } from "ai";
import { useRouter } from "next/navigation";
import { GUEST_CHAT_KEY_PREFIX, USER_CHAT_KEY_PREFIX } from "@/utils/constants";
import ReactMarkdown from "react-markdown";

// ─── Guest token helpers ───────────────────────────────────────────────────────

const GUEST_TOKEN_LIMIT = 10_000;
const GUEST_TOKEN_KEY = "meepletron_guest_tokens";

function loadGuestTokens() {
  try {
    const raw = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!raw) return GUEST_TOKEN_LIMIT;
    const { used, date } = JSON.parse(raw);
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (date !== todayUTC) return GUEST_TOKEN_LIMIT;
    return Math.max(0, GUEST_TOKEN_LIMIT - used);
  } catch { return GUEST_TOKEN_LIMIT; }
}

function saveGuestTokenUsage(tokensUsed) {
  try {
    const todayUTC = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(GUEST_TOKEN_KEY);
    const prev = raw ? JSON.parse(raw) : { used: 0, date: todayUTC };
    const usedTotal = prev.date === todayUTC ? prev.used + tokensUsed : tokensUsed;
    localStorage.setItem(GUEST_TOKEN_KEY, JSON.stringify({ used: usedTotal, date: todayUTC }));
    return Math.max(0, GUEST_TOKEN_LIMIT - usedTotal);
  } catch { return 0; }
}

// ─── Guest localStorage helpers ───────────────────────────────────────────────

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function guestKey(boardgameId) {
  return `${GUEST_CHAT_KEY_PREFIX}${boardgameId}`;
}

function loadGuestMessages(boardgameId) {
  try {
    const raw = localStorage.getItem(guestKey(boardgameId));
    if (!raw) return [];
    const { expiresAt, messages } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(guestKey(boardgameId)); return []; }
    return messages;
  } catch {
    return [];
  }
}

function saveGuestMessages(boardgameId, messages, game) {
  try {
    const key = guestKey(boardgameId);
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(key, JSON.stringify({
      expiresAt: existing.expiresAt ?? Date.now() + EXPIRY_MS,
      game: game ?? existing.game,
      messages,
    }));
  } catch {}
}

// ─── Signed-in user message cache ─────────────────────────────────────────────

function userCacheKey(boardgameId) {
  return `${USER_CHAT_KEY_PREFIX}${boardgameId}`;
}

function loadUserCache(boardgameId) {
  try {
    const raw = localStorage.getItem(userCacheKey(boardgameId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUserCache(boardgameId, chatId, messages) {
  try {
    localStorage.setItem(userCacheKey(boardgameId), JSON.stringify({ chatId, messages }));
  } catch {}
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getDateLabel(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDay) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  const [tokensRemaining, setTokensRemaining] = useState(null);
  const [showSignUpDrawer, setShowSignUpDrawer] = useState(false);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const didInitialScroll = useRef(false);
  const userScrolledUp = useRef(false);

  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading, error, data } = useChat({
    body: { boardgame_id: currentGame?._id, boardgame_title: currentGame?.title },
    onFinish: (message) => {
      if (user) {
        saveMessage(message.id, message.role, message.content, message.annotations);
      } else {
        const approxTokens = Math.ceil((message.content?.length ?? 0) / 4) + 1500;
        const newRemaining = saveGuestTokenUsage(approxTokens);
        setTokensRemaining(newRemaining);
        if (newRemaining <= 0) setShowSignUpDrawer(true);
      }
    },
    onError: (err) => {
      console.error("[chat] useChat error:", err);
      if (err.message?.includes("token_limit") || err.status === 429) {
        setTokensRemaining(0);
        if (!user) setShowSignUpDrawer(true);
        else toast.error("Daily token limit reached. Resets at midnight UTC.");
      } else {
        toast.error(err.message || "Something went wrong. Please try again.");
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
    const cached = loadUserCache(game._id);
    if (cached) {
      setChat({ _id: cached.chatId });
      setMessages(cached.messages);
      return;
    }

    setMessages([]);
    try {
      const res = await fetch(`/api/boardgames/${game._id}/chat`);
      const { data, message } = await res.json();
      if (!res.ok) throw new Error(message);

      if (Object.keys(data.chat).length === 0) {
        const createRes = await fetch(`/api/boardgames/${game._id}/chat`, {
          method: "POST",
          body: JSON.stringify({ user_id: user?.id, boardgame_id: game._id, parent_id: game.parent_id }),
        });
        const { data: newChat, message: createMsg } = await createRes.json();
        if (!createRes.ok) throw new Error(createMsg);
        toast.custom((t) => <CustomToast message={createMsg} id={t.id} />);
        setChat(newChat);
      } else {
        setChat(data.chat);
        setMessages(data.messages);
        saveUserCache(game._id, data.chat._id, data.messages);
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
        body: JSON.stringify({ _id: id, chat_id: chat._id, role, content, annotations, parent_id: currentGame?.parent_id }),
      });
      const { message } = await res.json();
      if (!res.ok) throw new Error(message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ─── Scroll handling ──────────────────────────────────────────────────────

  const handleScroll = (e) => {
    const el = e.target;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(atBottom);
    if (isLoading && !atBottom) userScrolledUp.current = true;
    if (atBottom) userScrolledUp.current = false;
  };

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // ─── Submit handler ───────────────────────────────────────────────────────

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (tokensRemaining !== null && tokensRemaining <= 0) {
      if (!user) setShowSignUpDrawer(true);
      else toast.error("Daily token limit reached. Resets at midnight UTC.");
      return;
    }
    const id = generateId();
    const currentInput = input;
    if (user && currentGame && chat) saveMessage(id, "user", currentInput);
    if (inputRef.current) inputRef.current.style.height = "auto";
    handleSubmit();
  };

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => { getBoardgame(); }, []);
  useEffect(() => { if (user && currentGame) getChat(currentGame); }, [currentGame, user]);
  useEffect(() => {
    if (isLoaded && !user && currentGame) setMessages(loadGuestMessages(currentGame._id));
  }, [currentGame, isLoaded, user]);
  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      fetch("/api/user/tokens")
        .then((r) => r.json())
        .then(({ remaining }) => setTokensRemaining(remaining))
        .catch(() => {});
    } else {
      setTokensRemaining(loadGuestTokens());
    }
  }, [isLoaded, user]);
  useEffect(() => {
    if (!data?.length) return;
    const latest = [...data].reverse().find((d) => d?.type === "tokens");
    if (latest && user) setTokensRemaining(latest.remaining);
  }, [data]);
  useEffect(() => {
    if (!user && isLoaded && !isLoading && messages.length > 0 && currentGame) {
      saveGuestMessages(currentGame._id, messages, {
        _id: currentGame._id, title: currentGame.title, thumbnail: currentGame.thumbnail,
      });
    }
    if (user && !isLoading && messages.length > 0 && currentGame && chat?._id) {
      saveUserCache(currentGame._id, chat._id, messages);
    }
  }, [isLoading]);
  // Reset initial-scroll flag when switching games
  useEffect(() => { didInitialScroll.current = false; }, [currentGame?._id]);
  // Scroll to bottom once when messages first load (cache, DB, or guest localStorage)
  useLayoutEffect(() => {
    if (!didInitialScroll.current && messages.length > 0 && !isLoading) {
      scrollToBottom();
      didInitialScroll.current = true;
    }
  }, [messages.length, isLoading]);
  // Scroll to bottom when streaming starts; reset scroll-up flag
  useLayoutEffect(() => {
    if (isLoading) { userScrolledUp.current = false; scrollToBottom(); }
    else userScrolledUp.current = false;
  }, [isLoading]);
  // Follow the stream — fires on every token; stops if user scrolled up
  useLayoutEffect(() => {
    if (isLoading && !userScrolledUp.current) scrollToBottom();
  }, [messages]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!boardgame) return <Loader height="h-screen" />;

  const expansionCount = boardgame.expansions?.length ?? 0;

  // Typing indicator phase detection
  const lastMsg = messages[messages.length - 1];
  const hasInitialized = data?.some((d) => d === "initialized call");
  const isStreaming = isLoading && lastMsg?.role === "assistant" && (lastMsg?.content?.length ?? 0) > 0;
  const loadingPhase = !hasInitialized ? "searching" : "reading";

  return (
    <section className="h-[100svh] flex flex-col">
      {/* Header */}
      <nav className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border-muted bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0">
          <IoArrowBack size={18} />
        </button>

        <Link
          href={`/boardgames/${currentGame?.parent_id ?? currentGame?._id}${
            currentGame?.parent_id ? `/expansions/${currentGame._id}` : ""
          }`}
          className="flex items-center gap-2.5 flex-1 min-w-0 group">
          <img src={currentGame?.thumbnail} alt={currentGame?.title} className="h-9 w-9 rounded-xl object-cover shrink-0 shadow-sm" />
          <div className="min-w-0">
            <h2 className="capitalize font-semibold truncate text-foreground group-hover:text-primary transition-colors">
              {currentGame?.title}
            </h2>
            {currentGame?.parent_id && <p className="text-sm text-subtle truncate">Expansion</p>}
          </div>
        </Link>

        <div className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0 flex items-center cursor-pointer [&>span]:hidden">
          <ThemeSwitch />
        </div>

        <button
          onClick={() => setSideNavOpen(true)}
          className="p-2 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0 flex flex-col items-center gap-0.5">
          <div className="relative">
            {expansionCount > 0 && (
              <span className="absolute -top-1.5 -right-2 text-[10px] font-bold leading-none text-primary">
                {expansionCount}
              </span>
            )}
            <BsLayers size={18} />
          </div>
          <span className="text-[10px] font-medium leading-none">expansions</span>
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
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-8">

          {messages.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-4 pt-10 pb-6 text-center px-6">
              <div className="relative">
                <img src={currentGame?.thumbnail} alt={currentGame?.title} className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
                <img
                  src="/logo.webp"
                  alt="Meepletron"
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-2 border-bg shadow object-contain bg-surface"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground capitalize">{currentGame?.title}</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">
                  Ask me anything about the rules,<br className="hidden sm:block" /> setup, or strategy.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {["How do I set up the game?", "What are the win conditions?", "How does turn order work?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => { handleInputChange({ target: { value: q } }); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted hover:bg-surface-muted hover:border-primary/50 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const msgDate = message.createdAt ?? null;
                const prevDate = index > 0 ? (messages[index - 1].createdAt ?? null) : null;
                const msgLabel = getDateLabel(msgDate);
                const prevLabel = getDateLabel(prevDate);
                const showSeparator = msgLabel && msgLabel !== prevLabel;
                const isLastAssistant = index === messages.length - 1 && message.role === "assistant";
                return (
                  <Fragment key={message._id || message.id}>
                    {showSeparator && <DateSeparator label={msgLabel} />}
                    <Message message={message} user={user} isStreaming={isLoading && isLastAssistant} />
                  </Fragment>
                );
              })}
            </AnimatePresence>

            <AnimatePresence>
              {isLoading && !isStreaming && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="flex items-end gap-2">
                  <img src="/logo.webp" alt="logo" className="w-7 h-7 object-contain rounded-full shrink-0 border border-border-muted" />
                  <TypingIndicator phase={loadingPhase} />
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
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-surface shadow-lg border border-border rounded-full p-2.5 text-muted hover:bg-surface-muted transition-colors z-10">
            <FaArrowDown size={13} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input form */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-border-muted bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm relative">
        {tokensRemaining !== null && (
          <span className={`absolute bottom-full right-3 mb-1 text-[10px] font-medium pointer-events-none ${tokensRemaining <= 5_000 ? "text-red-400" : "text-subtle/70"}`}>
            {tokensRemaining.toLocaleString()} tokens left today
          </span>
        )}
        <form
          onSubmit={onSubmit}
          className="max-w-xl mx-auto flex items-end gap-2 bg-surface-muted rounded-2xl px-3 py-2 ring-1 ring-border focus-within:ring-primary transition-all">
          <Textarea
            placeholder="Ask Meepletron…"
            rows="1"
            ref={inputRef}
            value={input}
            disabled={isLoading}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e); }
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            //make the focus outline none
            className="flex-1 bg-transparent border-none text-foreground placeholder:text-subtle focus:ring-0 focus-visible:ring-0"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 p-2.5 rounded-xl bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            <FaPaperPlane size={13} />
          </button>
        </form>
      </div>

      {/* Sign-up drawer (guest token limit) */}
      <AnimatePresence>
        {showSignUpDrawer && (
          <>
            <motion.div
              key="signup-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignUpDrawer(false)}
              className="fixed inset-0 bg-black/40 z-30 backdrop-blur-[1px]"
            />
            <motion.aside
              key="signup-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 w-72 h-full bg-bg z-40 shadow-2xl flex flex-col">

              <div className="flex items-start justify-between px-5 py-4 border-b border-border-muted">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Daily limit reached</h3>
                  <p className="text-xs text-muted mt-0.5">Sign up free to keep chatting</p>
                </div>
                <button
                  onClick={() => setShowSignUpDrawer(false)}
                  className="p-1.5 rounded-xl hover:bg-surface-muted transition-colors text-muted shrink-0 ml-2">
                  <IoClose size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
                <p className="text-sm text-muted leading-relaxed">
                  Guest accounts include{" "}
                  <span className="font-semibold text-foreground">10,000 tokens per day</span>.
                  Create a free account and get more — no credit card needed.
                </p>

                <div className="flex flex-col gap-3">
                  {[
                    { label: "50,000 tokens per day", sub: "5× more than guest" },
                    { label: "Permanent chat history", sub: "Never lose a conversation" },
                    { label: "Sync across devices", sub: "Pick up where you left off" },
                    { label: "Free forever", sub: "No payment required" },
                  ].map(({ label, sub }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                        <FaCheck size={9} className="text-primary" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
                        <p className="text-xs text-muted">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 pb-8 pt-4 flex flex-col gap-2 border-t border-border-muted">
                <Link
                  href="/sign-up"
                  className="w-full py-2.5 bg-primary text-primary-fg rounded-xl font-semibold text-sm text-center hover:bg-primary-hover transition-colors">
                  Create free account
                </Link>
                <Link
                  href="/sign-in"
                  className="w-full py-2.5 bg-surface-muted text-foreground rounded-xl font-medium text-sm text-center hover:bg-border-muted transition-colors border border-border-muted">
                  Sign in
                </Link>
                <p className="text-[10px] text-center text-subtle mt-1">
                  Guest tokens also reset daily at midnight UTC
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

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
              className="fixed top-0 right-0 w-72 h-full bg-bg z-20 shadow-2xl flex flex-col">

              <div className="flex items-center justify-between px-4 py-4 border-b border-border-muted">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Game Selector</h3>
                  <p className="text-xs text-subtle mt-0.5">Switch between base game &amp; expansions</p>
                </div>
                <button
                  onClick={() => setSideNavOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-surface-muted transition-colors text-muted">
                  <IoClose size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-subtle">
                  Base Game
                </p>
                <ListItem game={boardgame} currentGame={currentGame} setCurrentGame={setCurrentGame} setSideNavOpen={setSideNavOpen} />

                <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-subtle border-t border-border-muted mt-2">
                  Expansions
                  {expansionCount > 0 && (
                    <span className="ml-1.5 bg-primary/15 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                      {expansionCount}
                    </span>
                  )}
                </p>

                {expansionCount > 0 ? (
                  boardgame.expansions.map((exp) => (
                    <ListItem key={exp._id} game={exp} currentGame={currentGame} setCurrentGame={setCurrentGame} setSideNavOpen={setSideNavOpen} />
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                    <BsLayers size={28} className="text-border" />
                    <p className="text-sm font-medium text-subtle">No expansions yet</p>
                    <p className="text-xs text-subtle">Expansions will appear here once they&apos;re added.</p>
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
      onClick={() => { setCurrentGame(game); setSideNavOpen(false); }}
      className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all capitalize text-sm font-medium list-none ${
        isActive ? "bg-primary text-primary-fg shadow-sm" : "text-foreground hover:bg-surface-muted"
      }`}>
      <img src={game?.thumbnail} alt={game?.title} className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
      <span className="truncate">{game?.title}</span>
      {isActive && <span className="ml-auto text-[10px] font-semibold opacity-80 shrink-0">Active</span>}
    </li>
  );
};

const DateSeparator = ({ label }) => (
  <div className="flex items-center justify-center my-3">
    <span className="text-[11px] font-medium text-muted bg-surface-muted px-3 py-1 rounded-full border border-border-muted">
      {label}
    </span>
  </div>
);

const Message = ({ message, user, isStreaming }) => {
  const { _id, id, role, content, rating, annotations } = message;
  const isUser = role === "user";

  if (!isUser && !content) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <img src="/logo.webp" alt="Meepletron" className="w-7 h-7 object-contain rounded-full shrink-0 mb-1 border border-border-muted" />
      )}

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isUser
              ? "bg-primary text-primary-fg rounded-br-md shadow-sm"
              : "bg-surface-muted text-foreground rounded-bl-md shadow-sm ring-1 ring-border-muted"
          }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <>
              <ReactMarkdown
                components={{
                  p:      ({ children }) => <p className="text-sm leading-relaxed mb-1 last:mb-0">{children}</p>,
                  ul:     ({ children }) => <ul className="text-sm list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                  ol:     ({ children }) => <ol className="text-sm list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                  li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}>
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-[2px] h-[14px] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
              )}
            </>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2.5 px-1 flex-wrap">
            {annotations?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {annotations.map((ann, i) =>
                  ann.url ? (
                    <a
                      key={i}
                      href={ann.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-medium px-2 py-0.5 rounded-full border border-border bg-surface text-subtle hover:border-primary hover:text-primary transition-colors">
                      p.{ann.pageNumber}
                    </a>
                  ) : null
                )}
              </div>
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
      <button onClick={() => rateMessage("wrong")} className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
        <FaThumbsDown size={14} className={rating === "wrong" ? "text-red-500" : "text-muted"} />
      </button>
      <button onClick={() => rateMessage("correct")} className="p-1 rounded-md hover:bg-green-50 dark:hover:bg-green-500/10 transition-all">
        <FaThumbsUp size={14} className={rating === "correct" ? "text-green-500" : "text-muted"} />
      </button>
    </div>
  );
};
