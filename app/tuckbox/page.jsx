import { TuckboxDesigner } from "@/components/tuckbox/TuckboxDesigner";
import { loadBoardgame, loadExpansion } from "@/lib/server/boardgame-loader";
import { siteUrl } from "@/utils/siteUrl";

export const metadata = {
  title: "Free Tuckbox Generator — Print-Ready PDF for Any Card Game",
  description:
    "Design a custom tuckbox for your board game cards in seconds. Enter card size, drop in artwork, download a print-ready PDF. Free, no signup, works in your browser.",
  keywords: [
    "tuckbox generator",
    "tuckbox template",
    "card game tuckbox",
    "DIY card box",
    "print and play tuckbox",
    "custom card box maker",
    "tuckbox PDF",
    "board game card storage",
  ],
  alternates: { canonical: "/tuckbox" },
  openGraph: {
    title: "Tuckbox Generator | Meepletron",
    description:
      "Design and print a custom card-game tuckbox. Free, in-browser, with auto-fill from any game in our library.",
    url: "/tuckbox",
    type: "website",
    images: [{ url: "/tuckbox.png", width: 1200, height: 630, alt: "Tuckbox Generator preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tuckbox Generator",
    description:
      "Design and print a custom card-game tuckbox in your browser. Drop in artwork, download a PDF.",
    images: ["/tuckbox.png"],
  },
};

function buildJsonLd() {
  const tool = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Meepletron Tuckbox Generator",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web Browser",
    description:
      "Free browser-based tool to design and download a print-ready PDF tuckbox for board game cards. Auto-fills artwork from your favorite games.",
    url: `${siteUrl}/tuckbox`,
    image: `${siteUrl}/tuckbox.png`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Meepletron", url: siteUrl },
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to make a tuckbox for your card game",
    description:
      "Generate a print-ready custom tuckbox for any set of cards using the Meepletron Tuckbox Generator.",
    tool: ["Printer", "Cardstock paper", "Scissors", "Glue"],
    step: [
      { "@type": "HowToStep", name: "Open the generator", text: "Visit the Tuckbox Generator and pick a game from your library or upload your own artwork." },
      { "@type": "HowToStep", name: "Enter card dimensions", text: "Type the width, height, and stack thickness of your cards in millimeters or inches." },
      { "@type": "HowToStep", name: "Add artwork and labels", text: "Drop images onto each face, position them with snap anchors, and add text labels in any font, color, or size." },
      { "@type": "HowToStep", name: "Download the PDF", text: "Click Download PDF. Print on cardstock, cut along the outer lines, fold along the dotted lines, and glue the tabs." },
    ],
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Tuckbox Generator", item: `${siteUrl}/tuckbox` },
    ],
  };

  return [tool, howTo, breadcrumb];
}

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

  const jsonLd = buildJsonLd();

  return (
    <main className="min-h-screen pt-20 pb-16">
      {jsonLd.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
      <TuckboxDesigner initialBoardgame={initialBoardgame} />
    </main>
  );
}
