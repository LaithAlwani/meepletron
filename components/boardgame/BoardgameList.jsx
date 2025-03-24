"use client";
import toast from "react-hot-toast";
import BoardgameContainer from "./BoardgameContainer";
import { useGetBoardgames } from "@/utils/hooks";
import { Button } from "../ui";

const BoardgameSkeleton = () => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {[...Array(10)].map(
        (
          _,
          i // Render 8 skeletons (adjust as needed)
        ) => (
          <div key={i} className="w-[11rem] h-[11rem] bg-gray-200 animate-pulse rounded"></div> // Adjust size
        )
      )}
    </div>
  );
};

export default function BoardgameList() {
  const { isLoading, isLoadingMore, boardgames, totalGames, hasMore, fetchBoardgames, error } =
    useGetBoardgames({
      limit: 24,
    });
  if (error) toast.error(error);

  return isLoading ? (
    <BoardgameSkeleton /> // Show skeleton only initially
  ) : (
    <>
      <div className="relative flex py-5 items-center ">
        <div className="w-[3rem] border-t-2 border-gray-400 dark:border-yellow-300"></div>
        <h2 className=" px-4 text-2xl font-bold italic dark:text-yellow-500">
          Board Games <span className="text-xs">{totalGames > 0 && `(${totalGames})`}</span>
        </h2>
        <div className="flex-grow border-t-2 border-gray-400 dark:border-yellow-300"></div>
      </div>
      <div className="flex flex-wrap justify-center mb-8 gap-3">
        {boardgames?.map((boardgame, index) => (
          <BoardgameContainer key={boardgame._id} boardgame={boardgame} />
        ))}
      </div>
      {isLoadingMore ? ( // Show skeleton when new games are loading
        <BoardgameSkeleton />
      ) : (
        boardgames.length > 0 &&
        hasMore &&
        !isLoading && (
          <Button
            onClick={fetchBoardgames}
            isLoading={isLoadingMore}
            styles="max-w-[150px] w-full block mx-auto mb-[10rem]">
            Load More
          </Button>
        )
      )}
    </>
  );
}
