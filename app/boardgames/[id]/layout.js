import BackgroundImage from "@/components/boardgame/BackgroundImage";

const dev = "http://localhost:3000"
const prod = "https://www.meepletron.com"

async function fetchBoardGame(id) {
  // Replace with actual API call or database query
  const res = await fetch(`${process.env.NODE_ENV != "production" ? dev:prod}/api/boardgames/${id}`);
  if (!res.ok) return null; // Handle errors
  const data = await res.json();
  
  return data;
}

export default async function BoardGameLayout({ children, params }) {
  const {id} = await params;
  const data = await fetchBoardGame(id);
  const boardgame = data?.data?.boardgame
  
  return (
    <>
      {/* Header */}
      <BackgroundImage image={boardgame?.wallpaper || boardgame?.image} title={boardgame?.title} />
      {/* Main Content */}
      {children}
    </>
  );
}
