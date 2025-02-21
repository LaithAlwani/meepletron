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
    <section className="pt-[6rem] px-2 max-w-xl mx-auto mb-6 min-h-full">
      <SearchBoardGame />
      <div className="relative flex py-5 items-center ">
        <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
        <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Recently Added</h2>
        <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 ">
        <BoardgameList />
      </div>
    </section>
  );
}
