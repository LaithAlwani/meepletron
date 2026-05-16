"use client";
import { useEffect, useState } from "react";
import { loadGuestTokens } from "@/lib/chat-storage";

// Tracks remaining daily tokens for the active viewer:
//   - signed-in user: fetched from /api/user/tokens, then updated from the
//     useChat data stream as the server reports new usage.
//   - guest:          read from localStorage.
//
// Returns the same `[value, setter]` shape as useState so the page can also
// push values from its own logic (e.g. the guest onFinish handler).
export function useTokenTracking(user, isLoaded, data) {
  const [tokensRemaining, setTokensRemaining] = useState(null);

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
  }, [data, user]);

  return [tokensRemaining, setTokensRemaining];
}
