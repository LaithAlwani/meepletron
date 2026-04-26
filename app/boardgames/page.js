import BoardgameList from "@/components/boardgame/BoardgameList";

export const metadata = {
  title: "Board Games",
  alternates: {
    canonical: "/boardgames",
  },
};

export default function BoardgamePage() {
  return (
    <main className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <BoardgameList />
      </div>
    </main>
  );
}
