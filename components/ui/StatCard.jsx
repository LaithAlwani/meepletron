const colors = {
  slate:  "bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300",
  blue:   "bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  violet: "bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
  green:  "bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400",
  amber:  "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export default function StatCard({ icon, label, value, sub, loading, color = "slate", size = "md" }) {
  const iconSize = size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const iconRadius = size === "lg" ? "rounded-xl" : "rounded-xl";

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm">
      <div className={`${iconSize} ${iconRadius} flex items-center justify-center shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      {loading ? (
        <div className="space-y-1.5">
          <div className="h-6 w-14 rounded-lg bg-border animate-pulse" />
          <div className="h-3 w-20 rounded bg-border animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {typeof value === "string" ? value : (value?.toLocaleString() ?? "—")}
          </p>
          {sub && <p className="text-xs text-subtle mt-0.5 tabular-nums">{sub}</p>}
        </div>
      )}
      <p className="text-xs text-subtle leading-tight">{label}</p>
    </div>
  );
}
