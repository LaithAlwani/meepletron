export default function ChipList({ items }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-surface-muted text-muted border border-border">
          {item}
        </span>
      ))}
    </div>
  );
}
