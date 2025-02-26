"use client";
import { useRef } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import BoardgameContainer from "./BoardgameContainer";
import { useGetBoardgames } from "@/utils/hooks";

const BoardGameScroller = () => {
  const { boardgames, isLoading, error } = useGetBoardgames();
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300; // Adjust as needed
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    boardgames.length > 0 && (
      <div className="relative w-full px-4">
        <ScrollButton dir="left" scroll={scroll}>
          <LuChevronLeft size={24} />
        </ScrollButton>

        <div ref={scrollRef} className="relative h-[176px] flex justify-start gap-4 overflow-x-scroll hide-scrollbar">
          {isLoading ? (
            <BoardgameSkeleton />
          ) : (
            boardgames.map((boardgame) => (
              <BoardgameContainer boardgame={boardgame} key={boardgame._id} />
            ))
          )}
        </div>

        <ScrollButton dir="right" scroll={scroll}>
          <LuChevronRight size={24} />
        </ScrollButton>
      </div>
    )
  );
};

export default BoardGameScroller;

const ScrollButton = ({ children, dir, scroll }) => {
  return (
    <span
      className={`absolute ${
        dir === "right" ? "-right-0" : "-left-0"
      } top-1/2 -translate-y-1/2 z-10 p-2
  rounded-full shadow-lg bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-300 dark:hover:bg-slate-200 dark:text-slate-800  transition hidden md:block cursor-pointer`}
      onClick={() => scroll(dir)}>
      {children}
    </span>
  );
};

const BoardgameSkeleton = () => {
  return (
    <div className="">
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
