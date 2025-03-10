import BackgroundImage from "@/components/boardgame/BackgroundImage";
import Head from "next/head";

const dev = "http://localhost:3000";
const prod = "https://www.meepletron.com";

async function fetchBoardGame(id) {
  // Replace with actual API call or database query
  const res = await fetch(
    `${process.env.NODE_ENV != "production" ? dev : prod}/api/boardgames/${id}`
  );
  if (!res.ok) return null; // Handle errors
  const {data} = await res.json();
  return {boardgame:data};
}

export default async function BoardGameLayout({ children, params }) {
  const { id } = await params;
  const {boardgame} = await fetchBoardGame(id);

  return (
    <>
      <Head>
        <title>{boardgame?.title} - Board Game | Meepletron</title>
        <meta name="description" content={boardgame?.description} />
        <meta property="og:title" content={`${boardgame?.title} - Board Game`} />
        <meta property="og:description" content={boardgame?.description} />
        <meta property="og:image" content={boardgame?.image} />
        <meta property="og:url" content={`https://meepletron.com/boardgames/${id}`} />
      </Head>
      {/* Header */}
      <BackgroundImage image={boardgame?.wallpaper || boardgame?.image} title={boardgame?.title} />
      {/* Main Content */}
      {children}
    </>
  );
}
