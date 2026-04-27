export default function Card({ label, children }) {
  return (
    <div className="bg-surface rounded-xl shadow-sm ring-1 ring-border p-5 space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-subtle">{label}</h2>
      {children}
    </div>
  );
}
