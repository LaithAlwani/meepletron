"use client";
import toast from "react-hot-toast";
import BoardgameContainer from "./BoardgameContainer";
import { useGetBoardgames } from "@/utils/hooks";

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
  const { isLoading, boardgames, error } = useGetBoardgames({limit:50});

  if (error) toast.error(error);

  return isLoading ? (
    <BoardgameSkeleton />
  ) : (
    boardgames?.map((boardgame) => <BoardgameContainer key={boardgame._id} boardgame={boardgame} />)
  );
}
