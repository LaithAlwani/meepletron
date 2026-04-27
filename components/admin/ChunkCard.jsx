export default function ChunkCard({ chunk, index }) {
  return (
    <div className="bg-surface-muted rounded-lg p-3 text-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-semibold text-primary">Chunk {index + 1}</span>
        {chunk.metadata?.loc?.pageNumber && (
          <span className="bg-border text-muted px-1.5 py-0.5 rounded text-xs">
            Page {chunk.metadata.loc.pageNumber}
          </span>
        )}
      </div>
      <p className="text-muted line-clamp-3 leading-relaxed">{chunk.pageContent}</p>
    </div>
  );
}
