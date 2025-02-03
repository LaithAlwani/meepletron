import BoardgameContainer from "@/components/boardgame/BoardgameContainer";
import SearchBoardGame from "@/components/SearchBoardGame";
import connectToDB from "@/utils/database";
import Boardgame from "@/models/boardgame";

export const metadata = {
  title: "Board Games",
  alternates: {
    canonical: "/boardgames",
  },
};

const getBoardgames = async () => {
  await connectToDB();
  try {
    const boardgames = await Boardgame.find({}, "title image")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    //get the user favorites list user.find({_id:user.id}).select("favorites").lean()
    // compare const isFavorited = user.favorites.includes(boardGameId); board game componenet
    return boardgames;
  } catch (err) {
    console.log(err);
  }
};

export default async function BoargamePage() {
  const boardgames = await getBoardgames();

  return (
    <section className="px-2 max-w-xl mx-auto mb-6">
      <SearchBoardGame />
      <div className="relative flex py-5 items-center">
        <div className="w-[3rem] border-t border-gray-400 dark:border-yellow-300"></div>
        <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">Recently Added</h2>
        <div className="flex-grow border-t border-gray-400 dark:border-yellow-300"></div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {boardgames?.map((boardgame) => (
          <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
        ))}
      </div>
    </section>
  );
}
