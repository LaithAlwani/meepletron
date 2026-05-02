export default function ChatsListSkeleton() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-4 animate-pulse">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6 space-y-2">
          <div className="h-3 w-24 rounded bg-border" />
          <div className="h-8 w-48 rounded bg-border" />
          <div className="h-3 w-32 rounded bg-border" />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="h-10 w-full rounded-xl bg-border" />
        </div>

        {/* List */}
        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ChatCardSkeleton key={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChatCardSkeleton() {
  return (
    <li className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-border-muted">
      <div className="w-12 h-12 rounded-xl bg-border shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="h-3.5 w-32 rounded bg-border" />
          <div className="h-2.5 w-12 rounded bg-border shrink-0" />
        </div>
        <div className="h-2.5 w-3/4 rounded bg-border" />
      </div>
      <div className="w-9 h-9 rounded-xl bg-border shrink-0" />
    </li>
  );
}
