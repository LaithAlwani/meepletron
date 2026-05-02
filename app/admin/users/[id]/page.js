"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import Loader from "@/components/Loader";
import {
  MdPerson, MdThumbUp, MdThumbDown, MdOutlineHelpOutline,
  MdOutlineChat, MdOutlineMessage, MdSmartToy,
} from "react-icons/md";

export default function AdminUserDetailPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const { message } = await r.json();
          throw new Error(message || "Failed to load user");
        }
        return r.json();
      })
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader width="4rem" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin/users" className="text-subtle hover:text-foreground transition-colors text-sm">
            ← Back
          </Link>
          <p className="text-center text-subtle py-16">{error || "User not found"}</p>
        </div>
      </div>
    );
  }

  const { user, chats, stats } = data;
  const totalRated = stats.correctRatings + stats.wrongRatings;
  const ratingPct = totalRated > 0 ? Math.round((stats.correctRatings / totalRated) * 100) : null;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Anonymous";
  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-8 flex items-center gap-3">
          <Link href="/admin/users" className="text-subtle hover:text-foreground transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-2xl font-bold text-foreground">User</h1>
        </div>

        {/* Profile header */}
        <div className="bg-surface rounded-2xl border border-border-muted shadow-sm p-6 mb-6 flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt={name} className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center text-subtle">
              <MdPerson size={28} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
            <p className="text-sm text-muted truncate">{user.email_address}</p>
            {user.username && <p className="text-xs text-subtle truncate">@{user.username}</p>}
            <p className="text-xs text-subtle mt-1">Joined {joined}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatBox icon={<MdOutlineChat size={18} />} label="Chats" value={stats.totalChats} />
          <StatBox icon={<MdOutlineMessage size={18} />} label="Questions" value={stats.userMessages} />
          <StatBox icon={<MdSmartToy size={18} />} label="AI Responses" value={stats.aiMessages} />
          <StatBox
            icon={<MdThumbUp size={18} />}
            label="Rating"
            value={ratingPct !== null ? `${ratingPct}%` : "—"}
            sub={totalRated > 0 ? `${stats.correctRatings}/${totalRated}` : null}
          />
        </div>

        {/* Chats */}
        <p className="text-xs uppercase tracking-widest text-subtle font-semibold mb-3 px-1">Chats</p>

        {chats.length === 0 ? (
          <p className="text-center text-subtle py-12 bg-surface rounded-2xl border border-border-muted">
            No chats yet.
          </p>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <ChatCard key={chat._id} chat={chat} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function StatBox({ icon, label, value, sub }) {
  return (
    <div className="bg-surface border border-border-muted rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-subtle mb-1">
        {icon}
        <span className="text-[11px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted tabular-nums">{sub}</p>}
    </div>
  );
}

function ChatCard({ chat }) {
  const game = chat.boardgame;
  const date = new Date(chat.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  // Pair user → assistant messages
  const pairs = [];
  let pendingQuestion = null;
  for (const m of chat.messages) {
    if (m.role === "user") {
      if (pendingQuestion) pairs.push({ question: pendingQuestion, answer: null });
      pendingQuestion = m;
    } else if (m.role === "assistant") {
      pairs.push({ question: pendingQuestion, answer: m });
      pendingQuestion = null;
    }
  }
  if (pendingQuestion) pairs.push({ question: pendingQuestion, answer: null });

  return (
    <div className="bg-surface border border-border-muted rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 bg-surface-muted/40 border-b border-border-muted">
        {game?.thumbnail ? (
          <img src={game.thumbnail} alt={game.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-border shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground capitalize truncate">
            {game?.title || "Deleted game"}
          </p>
          <p className="text-xs text-subtle">{date} · {chat.messages.length} messages</p>
        </div>
      </div>

      <div className="divide-y divide-border-muted">
        {pairs.map((pair, i) => (
          <MessagePair key={i} pair={pair} />
        ))}
      </div>
    </div>
  );
}

function MessagePair({ pair }) {
  const { question, answer } = pair;
  const rating = answer?.rating;

  return (
    <div className="px-5 py-4 space-y-3">
      {question && (
        <div className="flex gap-2">
          <span className="text-[10px] uppercase tracking-wider text-subtle font-semibold pt-0.5 shrink-0 w-8">Q</span>
          <p className="text-sm text-foreground whitespace-pre-wrap flex-1">{question.content}</p>
        </div>
      )}
      {answer && (
        <div className="flex gap-2">
          <span className="text-[10px] uppercase tracking-wider text-subtle font-semibold pt-0.5 shrink-0 w-8">A</span>
          <div className="flex-1">
            <p className="text-sm text-muted whitespace-pre-wrap">{answer.content}</p>
            <RatingBadge rating={rating} />
          </div>
        </div>
      )}
      {!answer && question && (
        <div className="flex gap-2">
          <span className="text-[10px] uppercase tracking-wider text-subtle font-semibold pt-0.5 shrink-0 w-8">A</span>
          <p className="text-xs text-subtle italic flex-1">No response recorded</p>
        </div>
      )}
    </div>
  );
}

function RatingBadge({ rating }) {
  if (rating === "correct") {
    return (
      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-green-600 dark:text-green-400">
        <MdThumbUp size={12} /> Rated correct
      </span>
    );
  }
  if (rating === "wrong") {
    return (
      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-red-600 dark:text-red-400">
        <MdThumbDown size={12} /> Rated wrong
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-subtle">
      <MdOutlineHelpOutline size={12} /> Unrated
    </span>
  );
}
