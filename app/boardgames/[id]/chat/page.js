"use client";
import { useChat } from "ai/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { generateId } from "ai";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

import ChatSkeleton from "@/components/ChatSkeleton";
import SourcePanel from "@/components/chat/SourcePanel";
import ChatHeader from "@/components/chat/ChatHeader";
import ActiveSourcesPill from "@/components/chat/ActiveSourcesPill";
import EmptyChatState from "@/components/chat/EmptyChatState";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import SignUpDrawer from "@/components/chat/SignUpDrawer";
import ExpansionSideNav from "@/components/chat/ExpansionSideNav";
import GuestBanner from "@/components/chat/GuestBanner";
import ScrollToBottomButton from "@/components/chat/ScrollToBottomButton";

import {
  saveGuestTokenUsage,
  loadGuestMessages,
  saveGuestMessages,
  loadUserCache,
  saveUserCache,
} from "@/lib/chat-storage";
import { useExtraSources } from "@/hooks/useExtraSources";
import { useTokenTracking } from "@/hooks/useTokenTracking";
import { fetchBoardgame, fetchOrCreateChat, postSaveMessage } from "@/lib/chat-api";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [chat, setChat] = useState(null);
  const [boardgame, setBoardgame] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [sourceFocusChunkId, setSourceFocusChunkId] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showSignUpDrawer, setShowSignUpDrawer] = useState(false);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const userScrolledUp = useRef(false);

  const { extraSourceIds, toggleExtraSource } = useExtraSources(boardgame);

  const activeSourceIds = boardgame?._id
    ? [boardgame._id, ...extraSourceIds.filter((id) => id !== boardgame._id)]
    : [];

  // Expansion titles the user chose NOT to load — sent to the chat API so
  // the system prompt can refuse questions about them rather than leak
  // training-data knowledge.
  const unloadedSourceTitles = (boardgame?.expansions || [])
    .filter((e) => !extraSourceIds.includes(e._id))
    .map((e) => e.title);

  const { messages, setMessages, input, handleInputChange, handleSubmit, isLoading, data } =
    useChat({
      body: {
        boardgame_ids: activeSourceIds,
        boardgame_title: boardgame?.title,
        unloaded_source_titles: unloadedSourceTitles,
      },
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

  const [tokensRemaining, setTokensRemaining] = useTokenTracking(user, isLoaded, data);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const loadBoardgame = async () => {
    setBoardgame(null);
    setCurrentGame(null);
    try {
      const data = await fetchBoardgame(params.id);
      setBoardgame(data);
      setCurrentGame(data);
    } catch (err) { console.error(err); }
  };

  const loadChat = async (game) => {
    setMessagesLoaded(false);
    const cached = loadUserCache(game._id);
    if (cached) {
      setChat({ _id: cached.chatId });
      setMessages(cached.messages);
      setMessagesLoaded(true);
      return;
    }
    setMessages([]);
    try {
      const { chat: c, messages: msgs, createdMessage } = await fetchOrCreateChat({ game, userId: user?.id });
      if (createdMessage) toast.success(createdMessage);
      setChat(c);
      if (msgs.length) {
        setMessages(msgs);
        saveUserCache(game._id, c._id, msgs);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMessagesLoaded(true);
    }
  };

  const saveMessage = async (id, role, content, annotations) => {
    if (!id || !role || !content || !chat?._id) return;
    try {
      await postSaveMessage({ _id: id, chat_id: chat._id, role, content, annotations, parent_id: currentGame?.parent_id });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleScroll = (e) => {
    const el = e.target;
    const atBottom = el.scrollTop <= 60;
    setIsAtBottom(atBottom);
    if (isLoading && !atBottom) userScrolledUp.current = true;
    if (atBottom) userScrolledUp.current = false;
  };

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = 0;
  };

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

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => { loadBoardgame(); }, []);

  useEffect(() => { if (user && currentGame) loadChat(currentGame); }, [currentGame, user]);

  useEffect(() => {
    if (isLoaded && !user && currentGame) {
      setMessages(loadGuestMessages(currentGame._id));
      setMessagesLoaded(true);
    }
  }, [currentGame, isLoaded, user]);

  // Persist messages after every streaming response settles
  useEffect(() => {
    if (isLoading || messages.length === 0 || !currentGame) return;
    if (!user && isLoaded) {
      saveGuestMessages(currentGame._id, messages, {
        _id: currentGame._id, title: currentGame.title, thumbnail: currentGame.thumbnail,
      });
    }
    if (user && chat?._id) {
      saveUserCache(currentGame._id, chat._id, messages);
    }
  }, [isLoading]);

  useLayoutEffect(() => { userScrolledUp.current = false; }, [isLoading]);
  useLayoutEffect(() => {
    if (isLoading && !userScrolledUp.current) scrollToBottom();
  }, [messages]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!boardgame || !messagesLoaded) return <ChatSkeleton />;

  const lastMsg = messages[messages.length - 1];
  const hasInitialized = data?.some((d) => d === "initialized call");
  const isStreaming = isLoading && lastMsg?.role === "assistant" && (lastMsg?.content?.length ?? 0) > 0;
  const loadingPhase = !hasInitialized ? "searching" : "reading";

  return (
    <section className="h-[100svh] flex flex-col">
      <ChatHeader
        currentGame={currentGame}
        boardgame={boardgame}
        expansionCount={boardgame.expansions?.length ?? 0}
        onBack={() => router.back()}
        onRulebookClick={() => { setSourceFocusChunkId(null); setSourcePanelOpen(true); }}
        onExpansionsClick={() => setSideNavOpen(true)}
      />

      <GuestBanner show={isLoaded && !user} />

      <ActiveSourcesPill
        boardgame={boardgame}
        extraSourceIds={extraSourceIds}
        onRemove={toggleExtraSource}
      />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto hide-scrollbar flex flex-col-reverse">
        <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-8">
          {messages.length === 0 && !isLoading && (
            <EmptyChatState
              currentGame={currentGame}
              onSampleClick={(q) => {
                handleInputChange({ target: { value: q } });
                inputRef.current?.focus();
              }}
            />
          )}

          <MessageList
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            loadingPhase={loadingPhase}
            user={user}
            baseGameId={boardgame?._id}
            onJumpToChunk={(chunk) => {
              setSourceFocusChunkId(chunk?.chunkId || `${chunk?.bg_id}-c${String(chunk?.id - 1).padStart(4, "0")}`);
              setSourcePanelOpen(true);
            }}
          />
        </div>
      </div>

      <ScrollToBottomButton show={!isAtBottom} onClick={scrollToBottom} />

      <ChatInput
        input={input}
        inputRef={inputRef}
        onInputChange={handleInputChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
        tokensRemaining={tokensRemaining}
      />

      <SignUpDrawer open={showSignUpDrawer} onClose={() => setShowSignUpDrawer(false)} />

      <SourcePanel
        open={sourcePanelOpen}
        onClose={() => setSourcePanelOpen(false)}
        gameIds={activeSourceIds}
        focusChunkId={sourceFocusChunkId}
      />

      <ExpansionSideNav
        open={sideNavOpen}
        onClose={() => setSideNavOpen(false)}
        boardgame={boardgame}
        extraSourceIds={extraSourceIds}
        onToggleSource={toggleExtraSource}
      />
    </section>
  );
}
