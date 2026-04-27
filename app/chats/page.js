"use client";
import CustomToast from "@/components/CustomeToast";
import Loader from "@/components/Loader";
import { Input } from "@/components/ui";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";
import { IoChatbubbles } from "react-icons/io5";
import { GUEST_CHAT_KEY_PREFIX } from "@/utils/constants";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isThisYear) return date.toLocaleDateString([], { month: "short", day: "numeric" });
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

const GUEST_PREFIX = GUEST_CHAT_KEY_PREFIX;

function loadAllGuestChats() {
  const chats = [];
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(GUEST_PREFIX)) continue;
      try {
        const { expiresAt, game, messages } = JSON.parse(localStorage.getItem(key));
        if (Date.now() > expiresAt) { localStorage.removeItem(key); continue; }
        if (game && messages?.length > 0) chats.push({ key, game, messages, expiresAt });
      } catch {}
    }
  } catch {}
  return chats;
}

export default function ChatsPage() {
  const { user, isLoaded } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState([]);
  const [guestChats, setGuestChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getChats = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat?user_id=${user.id}`);
      const { data, message } = await res.json();
      if (!res.ok) return toast.error(message);
      setChats(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chat_id, boardgame_id) => {
    const res = await fetch("/api/chat/delete", {
      method: "POST",
      body: JSON.stringify({ chat_id, boardgame_id }),
    });
    const { message } = await res.json();
    if (!res.ok) return toast.error(message);
    toast.custom((t) => <CustomToast message={message} id={t.id} />);
    setChats((prev) => prev.filter((chat) => chat._id !== chat_id));
  };

  const deleteGuestChat = (key) => {
    try { localStorage.removeItem(key); } catch {}
    setGuestChats((prev) => prev.filter((c) => c.key !== key));
  };

  useEffect(() => { getChats(); }, [user]);

  useEffect(() => {
    if (isLoaded && !user) setGuestChats(loadAllGuestChats());
  }, [isLoaded, user]);

  const displayChats = user ? chats : guestChats;

  const filteredChats = useMemo(() => {
    if (!searchTerm) return displayChats;
    const lower = searchTerm.toLowerCase();
    return displayChats.filter((item) => {
      const title = user ? item.boardgame_id?.title : item.game?.title;
      return title?.toLowerCase().includes(lower);
    });
  }, [displayChats, searchTerm, user]);

  if (!isLoaded || (user && isLoading)) {
    return <div className="pt-24"><Loader width="6rem" /></div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        <AnimatePresence>
          {isLoaded && !user && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 rounded-2xl bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 px-4 py-3 text-sm text-amber-700 dark:text-yellow-400">
              <Link href="/sign-in" className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity">
                Sign in
              </Link>{" "}
              to save your chat history permanently — guest chats are kept for 30 days and stored only on this device.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-subtle font-medium mb-1">
            {user ? "Your account" : "This device"}
          </p>
          <h1 className="text-3xl font-bold text-foreground">Chat History</h1>
          <p className="text-sm text-muted mt-1">
            {displayChats.length > 0
              ? `${displayChats.length} conversation${displayChats.length !== 1 ? "s" : ""}`
              : "No conversations yet"}
          </p>
        </div>

        {displayChats.length > 1 && (
          <div className="mb-4">
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search chats…" />
          </div>
        )}

        {filteredChats.length > 0 ? (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {filteredChats.map((item) => {
                if (user) {
                  const { _id, boardgame_id, last_message, last_message_at, updatedAt } = item;
                  return (
                    <ChatCard
                      key={_id}
                      title={boardgame_id.title}
                      thumbnail={boardgame_id.thumbnail}
                      href={`/boardgames/${boardgame_id._id}/chat`}
                      preview={last_message}
                      date={formatDate(last_message_at || updatedAt)}
                      onDelete={() => deleteChat(_id, boardgame_id._id)}
                    />
                  );
                } else {
                  const { key, game, messages } = item;
                  const lastMsg = [...messages].reverse().find((m) => m.role === "assistant");
                  return (
                    <ChatCard
                      key={key}
                      title={game.title}
                      thumbnail={game.thumbnail}
                      href={`/boardgames/${game._id}/chat`}
                      preview={lastMsg?.content}
                      date={formatDate(lastMsg?.createdAt)}
                      onDelete={() => deleteGuestChat(key)}
                    />
                  );
                }
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 pt-20 text-center">
            <IoChatbubbles size={52} className="text-border" />
            <div>
              <h3 className="font-semibold text-foreground">
                {searchTerm ? "No matching chats" : "No chats yet"}
              </h3>
              <p className="text-sm text-subtle mt-1">
                {searchTerm ? "Try a different search term." : "Start a conversation from any board game page."}
              </p>
            </div>
            {!searchTerm && (
              <Link href="/boardgames" className="text-sm font-medium text-primary hover:underline underline-offset-2 transition-colors">
                Browse board games →
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ChatCard({ title, thumbnail, href, preview, date, onDelete }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border-muted hover:border-primary/30 shadow-sm hover:shadow transition-all group">
      <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
        <img src={thumbnail} alt={title} className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="capitalize font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
            {date && <span className="text-[11px] text-subtle shrink-0">{date}</span>}
          </div>
          {preview && <p className="text-xs text-subtle truncate mt-0.5">{preview}</p>}
        </div>
      </Link>
      <button
        onClick={onDelete}
        className="shrink-0 p-2 rounded-xl text-border hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all">
        <MdDelete size={18} />
      </button>
    </motion.li>
  );
}
