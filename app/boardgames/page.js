import BoardgameList from "@/components/boardgame/BoardgameList";
import SearchBoardGame from "@/components/SearchBoardGame";

export const metadata = {
  title: "Board Games",
  alternates: {
    canonical: "/boardgames",
  },
};

export default async function BoargamePage() {
  return (
    <section className="max-w-xl pt-[6rem] px-2 mx-auto mb-6 min-h-full">
      

      <BoardgameList />
    </section>
  );
}
