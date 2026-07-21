import { ImageResponse } from "next/og";
import { seo } from "@/lib/seo";

export const alt = seo.homeTitle;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#ffffff",
          color: "#0B1220",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 52 }}>
          <svg width="120" height="120" viewBox="0 0 360 360" fill="none">
            <path
              d="M118 84 A108 108 0 1 1 84 118"
              stroke="#1447E6"
              strokeWidth="27"
              strokeLinecap="round"
            />
            <rect x="166.5" y="111" width="27" height="88" rx="13.5" fill="#1447E6" />
            <circle cx="180" cy="229" r="14" fill="#1447E6" />
          </svg>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
            <span>Retrase</span>
            <span style={{ color: "#1447E6" }}>.ro</span>
          </div>
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, maxWidth: 960 }}>
          Medicamente și produse retrase din România
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#475569", maxWidth: 900, lineHeight: 1.35 }}>
          Monitorizare ANMDMR și ANSVSA pentru medicamente retrase și produse retrase.
        </div>
      </div>
    ),
    size
  );
}
