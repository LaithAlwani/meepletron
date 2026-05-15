import Link from "next/link";

export default function BoardgamePage() {
  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-1">Admin Panel</p>
          <h1 className="text-3xl font-bold text-foreground">Board Game Manager</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            href="/admin/boardgames/add"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            title="Add Game"
            description="Add a new board game, upload a rulebook PDF or image, and let AI process it for semantic search."
          />
          <ActionCard
            href="/admin/boardgames/edit"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            title="Edit Games"
            description="Search existing games, upload additional rulebook files, and manage AI embeddings."
          />
          <ActionCard
            href="/admin/boardgames/migrate"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
            title="Migrate to v2"
            description="Re-parse rulebooks with the new semantic chunker. Review chunks before committing to Pinecone."
          />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ href, icon, title, description }) {
  return (
    <Link
      href={href}
      className="group block bg-surface rounded-2xl p-6 shadow-sm ring-1 ring-border hover:ring-primary/40 transition-all duration-200 hover:shadow-md">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h2>
      <p className="text-sm text-muted mb-4">{description}</p>
      <div className="flex items-center text-sm font-medium text-primary">
        Open
        <span className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
      </div>
    </Link>
  );
}
