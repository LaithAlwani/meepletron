export default function ChatSkeleton() {
  return (
    <section className="h-[100svh] flex flex-col animate-pulse">
      {/* Header */}
      <nav className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border-muted bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-xl bg-border shrink-0" />

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-border shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-border" />
            <div className="h-2.5 w-20 rounded bg-border" />
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-border shrink-0" />
        <div className="w-9 h-9 rounded-xl bg-border shrink-0" />
      </nav>

      {/* Messages — bottom-anchored to match the real chat */}
      <div className="flex-1 overflow-hidden flex flex-col-reverse">
        <div className="w-full max-w-xl mx-auto px-4 pt-5 pb-8 space-y-4">
          <SkelMessage role="assistant" lines={2} bubbleWidth="68%" />
          <SkelMessage role="user"      lines={1} bubbleWidth="42%" />
          <SkelMessage role="assistant" lines={4} bubbleWidth="80%" />
          <SkelMessage role="user"      lines={2} bubbleWidth="58%" />
          <SkelMessage role="assistant" lines={3} bubbleWidth="74%" />
          <SkelMessage role="user"      lines={1} bubbleWidth="34%" />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-border-muted bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <div className="max-w-xl mx-auto flex items-end gap-2 bg-surface-muted rounded-2xl px-3 py-2 ring-1 ring-border">
          <div className="flex-1 h-9 rounded-lg bg-border" />
          <div className="w-9 h-9 rounded-xl bg-border shrink-0" />
        </div>
      </div>
    </section>
  );
}

function SkelMessage({ role, lines = 2, bubbleWidth = "60%" }) {
  const isUser = role === "user";
  const lineCls = isUser ? "bg-primary-fg/40" : "bg-foreground/15";

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-border shrink-0 mb-1" />
      )}

      <div
        className={`px-4 py-3 rounded-2xl space-y-2 ${
          isUser
            ? "bg-primary/40 rounded-br-md"
            : "bg-surface-muted ring-1 ring-border-muted rounded-bl-md"
        }`}
        style={{ width: bubbleWidth, maxWidth: "80%" }}
      >
        {Array.from({ length: lines }).map((_, i) => {
          const isLastLine = i === lines - 1 && lines > 1;
          const lineWidth = isLastLine ? "55%" : "100%";
          return (
            <div
              key={i}
              className={`h-3.5 rounded ${lineCls}`}
              style={{ width: lineWidth }}
            />
          );
        })}
      </div>
    </div>
  );
}
