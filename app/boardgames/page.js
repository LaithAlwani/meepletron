import BoardgameContainer from "@/components/boardgame/BoardgameContainer";
import SearchBoardGame from "@/components/SearchBoardGame";
import { getBoardgames } from "@/lib/functions";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "Board Games",
  alternates: {
    canonical: "/boardgames",
  },
};

export default async function BoargamePage() {
  const boardgames = await getBoardgames({ where: { is_expansion: false } });

  return (
    <section className="pt-[6rem] px-2 max-w-xl mx-auto mb-6 min-h-full">
      <SearchBoardGame />
      <div className="relative flex py-5 items-center ">
        <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
        <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Recently Added</h2>
        <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 ">
        {boardgames?.map((boardgame) => (
          <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
        ))}
      </div>
    </section>
  );
}
