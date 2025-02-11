import Carousel from "@/components/boardgame/Carousel";
import SearchBoardGame from "@/components/SearchBoardGame";
import { getBoardgames } from "@/lib/functions";

export const metadata = {
  title: "Board Games",
  alternates: {
    canonical: "/boardgames",
  },
};

export default async function BoargamePage() {
  const boardgames = await getBoardgames({ where: { is_expansion: false } });

  return (
    <section className=" mx-auto pt-20 pb-6 h-screen flex flex-col justify-between px-1">
      <SearchBoardGame />
      <Carousel items={JSON.stringify(boardgames)} />
    </section>
  );
}
