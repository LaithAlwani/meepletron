import BackgroundImage from "@/components/boardgame/BackgroundImage";
import { loadBoardgame } from "@/lib/server/boardgame-loader";

export default async function BoardGameLayout({ children, params }) {
  const { id } = await params;
  const boardgame = await loadBoardgame(id);

  return (
    <>
      <BackgroundImage image={boardgame?.image} title={boardgame?.title} />
      {children}
    </>
  );
}
