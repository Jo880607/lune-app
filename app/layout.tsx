import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lune - 진짜 나를 알아가는 SNS",
  description: "AI가 나의 기록을 분석해 나를 해석해주고, 감정 기반으로 연결되는 자기 탐색 플랫폼",
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
