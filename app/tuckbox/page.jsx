import { TuckboxDesigner } from "@/components/tuckbox/TuckboxDesigner";
import { loadBoardgame, loadExpansion } from "@/lib/server/boardgame-loader";

export const metadata = {
  title: "Tuckbox Generator | Meepletron",
  description:
    "Design and download a print-ready PDF tuckbox for your board game cards.",
};

export default async function TuckboxPage({ searchParams }) {
  const { gameId } = (await searchParams) ?? {};
  let initialBoardgame;

  if (gameId) {
    let game = await loadBoardgame(gameId);
    if (!game) game = await loadExpansion(gameId);
    if (game) {
      initialBoardgame = {
        title: game.title,
        imageUrl: game.image || game.thumbnail,
      };
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16">
      <TuckboxDesigner initialBoardgame={initialBoardgame} />
    </main>
  );
}
