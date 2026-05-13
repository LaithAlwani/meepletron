import { ImageResponse } from "next/og";
import { loadBoardgame } from "@/lib/server/boardgame-loader";

export const alt = "Meepletron — Board Game Rules";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }) {
  const { id } = await params;
  const bg = await loadBoardgame(id);

  const title = bg?.title || "Meepletron";
  const subtitle = bg
    ? [
        bg.min_players && bg.max_players
          ? bg.min_players === bg.max_players ? `${bg.min_players} players` : `${bg.min_players}–${bg.max_players} players`
          : null,
        bg.play_time ? `${bg.play_time} min` : null,
        bg.year,
      ]
        .filter(Boolean)
        .join("  ·  ")
    : "AI assistant for board game rules";
  const thumb = bg?.thumbnail;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {thumb && (
          <img
            src={thumb}
            alt=""
            width={400}
            height={400}
            style={{
              width: 400,
              height: 400,
              borderRadius: 32,
              objectFit: "cover",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              marginRight: 60,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            color: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#facc15",
              marginBottom: 16,
            }}
          >
            Meepletron
          </div>
          <div
            style={{
              fontSize: thumb ? 72 : 96,
              fontWeight: 800,
              lineHeight: 1.05,
              textTransform: "capitalize",
              marginBottom: 24,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 32,
                fontWeight: 500,
                color: "#cbd5e1",
              }}
            >
              {subtitle}
            </div>
          )}
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: "#94a3b8",
              marginTop: "auto",
              paddingTop: 32,
            }}
          >
            Rules · How to Play · Setup
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
