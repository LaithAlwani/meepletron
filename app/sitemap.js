import { getBoardgames } from "@/lib/functions";

const baseUrl =
  process.env.NODE_ENV != "production" ? "http://localhost:3000" : "https://www.meepletron.com";

export default async function sitemap() {
  const allboardgames = await getBoardgames();

  const boardgamePages = allboardgames.map((bg) => ({
    url: `${baseUrl}/boardgames/${bg.slug || bg._id}`,
    lastModified: bg.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/boardgames`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: "2025-02-15",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: "2025-02-15",
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: "2025-02-15",
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...boardgamePages,
  ];
}
