import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jero & Viah vs. The World | Feb 12, 2027 • Open-Air Beat-'Em-Up Wedding",
  description: "Join Jero & Viah on their 8-bit co-op wedding quest in Baguio City on February 12, 2027!",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="in-arcade-fullscreen">{children}</body>
    </html>
  );
}
