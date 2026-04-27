import BackgroundImage from "@/components/boardgame/BackgroundImage";
import { siteUrl } from "@/utils/siteUrl";

async function fetchBoardgame(id) {
  const res = await fetch(
    `${siteUrl}/api/boardgames/${id}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const { data } = await res.json();
  return data;
}

export default async function BoardGameLayout({ children, params }) {
  const { id } = await params;
  const boardgame = await fetchBoardgame(id);

  return (
    <>
      <BackgroundImage image={boardgame?.image} title={boardgame?.title} />
      {children}
    </>
  );
}
