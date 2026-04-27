export default function InfoSection({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-subtle mb-3 pb-2 border-b border-border-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
