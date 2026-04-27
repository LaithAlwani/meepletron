export default function StatBadge({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2.5 bg-surface border border-border px-3 py-2 rounded-xl text-sm">
      <span className="text-primary">{icon}</span>
      <div>
        <p className="font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[10px] text-subtle leading-tight mt-0.5">{label}</p>
      </div>
    </div>
  );
}
