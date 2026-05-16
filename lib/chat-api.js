// Thin async wrappers around the chat-related REST endpoints. Centralises
// JSON parsing, error throwing, and consistent error messages so the chat
// page only owns state, not fetch boilerplate.

export async function fetchBoardgame(idOrSlug) {
  const res = await fetch(`/api/boardgames/${idOrSlug}`);
  if (!res.ok) throw new Error("Failed to load game");
  const { data } = await res.json();
  return data;
}

// Loads the user's saved chat for this game, creating one if none exists.
// Returns { chat, messages, createdMessage } — `createdMessage` is only
// populated on first creation so the page can surface a toast.
export async function fetchOrCreateChat({ game, userId }) {
  const res = await fetch(`/api/boardgames/${game._id}/chat`);
  const { data, message } = await res.json();
  if (!res.ok) throw new Error(message);

  if (Object.keys(data.chat).length === 0) {
    const createRes = await fetch(`/api/boardgames/${game._id}/chat`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, boardgame_id: game._id, parent_id: game.parent_id }),
    });
    const { data: newChat, message: createMsg } = await createRes.json();
    if (!createRes.ok) throw new Error(createMsg);
    return { chat: newChat, messages: [], createdMessage: createMsg };
  }
  return { chat: data.chat, messages: data.messages, createdMessage: null };
}

export async function postSaveMessage(payload) {
  const res = await fetch("/api/chat/save-message", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const { message } = await res.json();
  if (!res.ok) throw new Error(message);
  return message;
}
