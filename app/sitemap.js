import { getBoardgames } from "@/lib/functions";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default async function sitemap() {
  const allboardgames = await getBoardgames();

  const boardgamePages = allboardgames.flatMap((bg) => {
    const gameSlug = `${bg.slug || bg._id}`; // Use slug if available, fallback to ID

    return [
      {
        url: `${baseUrl}/boardgames/${gameSlug}`,
        lastModified: bg.updatedAt,
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/boardgames/${gameSlug}/chat`,
        lastModified: bg.updatedAt,
        changeFrequency: "yearly",
        priority: 0.7,
      },
    ];
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
