// localStorage helpers backing the chat page.
//
//   Guest tokens   — daily quota gate for non-signed-in users.
//   Guest messages — 30-day rolling chat history for guests.
//   User cache     — keep the last server-loaded chat in memory so revisits
//                     don't refetch.
//
// All access goes through try/catch — Safari private mode and storage quotas
// can throw, and the chat must keep working either way.

import { GUEST_CHAT_KEY_PREFIX, USER_CHAT_KEY_PREFIX } from "@/utils/constants";

// ─── Guest tokens ────────────────────────────────────────────────────────────

export const GUEST_TOKEN_LIMIT = 10_000;
const GUEST_TOKEN_KEY = "meepletron_guest_tokens";

export function loadGuestTokens() {
  try {
    const raw = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!raw) return GUEST_TOKEN_LIMIT;
    const { used, date } = JSON.parse(raw);
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (date !== todayUTC) return GUEST_TOKEN_LIMIT;
    return Math.max(0, GUEST_TOKEN_LIMIT - used);
  } catch {
    return GUEST_TOKEN_LIMIT;
  }
}

export function saveGuestTokenUsage(tokensUsed) {
  try {
    const todayUTC = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(GUEST_TOKEN_KEY);
    const prev = raw ? JSON.parse(raw) : { used: 0, date: todayUTC };
    const usedTotal = prev.date === todayUTC ? prev.used + tokensUsed : tokensUsed;
    localStorage.setItem(GUEST_TOKEN_KEY, JSON.stringify({ used: usedTotal, date: todayUTC }));
    return Math.max(0, GUEST_TOKEN_LIMIT - usedTotal);
  } catch {
    return 0;
  }
}

// ─── Guest messages ──────────────────────────────────────────────────────────

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function guestKey(boardgameId) {
  return `${GUEST_CHAT_KEY_PREFIX}${boardgameId}`;
}

export function loadGuestMessages(boardgameId) {
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

export function saveGuestMessages(boardgameId, messages, game) {
  try {
    const key = guestKey(boardgameId);
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    localStorage.setItem(
      key,
      JSON.stringify({
        expiresAt: existing.expiresAt ?? Date.now() + EXPIRY_MS,
        game: game ?? existing.game,
        messages,
      }),
    );
  } catch {}
}

// ─── Signed-in user cache ────────────────────────────────────────────────────

function userCacheKey(boardgameId) {
  return `${USER_CHAT_KEY_PREFIX}${boardgameId}`;
}

export function loadUserCache(boardgameId) {
  try {
    const raw = localStorage.getItem(userCacheKey(boardgameId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserCache(boardgameId, chatId, messages) {
  try {
    localStorage.setItem(userCacheKey(boardgameId), JSON.stringify({ chatId, messages }));
  } catch {}
}
