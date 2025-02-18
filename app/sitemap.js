import { getBoardgames } from "@/lib/functions";

const baseUrl =
  process.env.NODE_ENV != "production" ? "http://localhost:3000" : "https://www.meepletron.com";

export default async function sitemap() {
  const allboardgames = await getBoardgames();

  const boardgamePages = allboardgames.map((bg) => {
    return {
      url: `${baseUrl}/boardgames/${bg._id}`,
      lastModified: bg.updatedAt,
      changeFrequency: "yearly",
      priority: 0.7,
    };
  });
  return [
    {
      url: `${baseUrl}/`,
      lastModified: "2025-02-15",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: "2025-02-15",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: "2025-02-15",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: "2025-02-15",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/boardgames`,
      lastModified: "2025-02-15",
      changeFrequency: "daily",
      priority: 1,
    },
    ...boardgamePages,
  ];
}
