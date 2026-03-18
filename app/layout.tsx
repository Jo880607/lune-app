import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lune",
  description: "진짜 나를 알아가는 SDS",
  manifest: "/manifest.json",
  themeColor: "#C8A8E9",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lune",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-black min-h-screen">
        <div className="max-w-[390px] mx-auto min-h-screen bg-[var(--bg)] relative shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
