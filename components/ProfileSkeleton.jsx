export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-bg pt-24 pb-16 px-4 animate-pulse">
      <div className="max-w-xl mx-auto">

        {/* Profile header */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border-muted p-8 mb-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-border mb-4" />
          <div className="h-5 w-40 rounded bg-border mb-2" />
          <div className="h-3 w-48 rounded bg-border" />
          <div className="h-3 w-32 rounded bg-border mt-4" />
          <div className="mt-6 h-9 w-28 rounded-xl bg-border" />
        </div>

        {/* Personal Info card */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border-muted p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-3 w-24 rounded bg-border" />
            <div className="h-3 w-10 rounded bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldSkel />
            <FieldSkel />
            <FieldSkel full />
          </div>
        </div>

        {/* Activity */}
        <div>
          <div className="h-3 w-20 rounded bg-border mb-3 mx-1" />
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkel />
            <StatCardSkel />
            <StatCardSkel />
            <StatCardSkel />
          </div>
        </div>

      </div>
    </div>
  );
}

function FieldSkel({ full = false }) {
  return (
    <div className={`space-y-1.5 ${full ? "col-span-2" : ""}`}>
      <div className="h-2.5 w-16 rounded bg-border" />
      <div className="h-9 w-full rounded-xl bg-border" />
    </div>
  );
}

function StatCardSkel() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl bg-surface border border-border-muted shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-border" />
      <div className="space-y-1.5">
        <div className="h-6 w-14 rounded-lg bg-border" />
        <div className="h-3 w-20 rounded bg-border" />
      </div>
      <div className="h-3 w-16 rounded bg-border" />
    </div>
  );
}
