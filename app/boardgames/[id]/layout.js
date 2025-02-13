import BackgroundImage from "@/components/boardgame/BackgroundImage";
import connectToDB from "@/utils/database";
import { cookies } from "next/headers";

async function fetchBoardGame(id) {
  // Replace with actual API call or database query
  const res = await fetch(`http://localhost:3000/api/boardgames/${id}`);
  if (!res.ok) return null; // Handle errors
  return res.json();
}

export default async function BoardGameLayout({ children, params }) {
  const {id} = await params;
  const data = await fetchBoardGame(id);
  const boardgame = data?.data?.boardgame
  
  return (
    <>
      {/* Header */}
      <BackgroundImage image={boardgame?.image} title={boardgame?.title} />
      {/* Main Content */}
      {children}
    </>
  );
}
