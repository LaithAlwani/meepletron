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
      const rawImage = game.image || game.thumbnail;
      // Route the image through our same-origin proxy so the client fetch
      // for CORS-restricted S3 assets succeeds. See app/api/images/proxy/route.js.
      const proxied = rawImage
        ? `/api/images/proxy?url=${encodeURIComponent(rawImage)}`
        : undefined;
      initialBoardgame = {
        title: game.title,
        imageUrl: proxied,
      };
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16">
      <TuckboxDesigner initialBoardgame={initialBoardgame} />
    </main>
  );
}
