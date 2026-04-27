import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공연 기록 - Festival Tracker",
  description: "페스티벌과 공연 관람 기록을 한 곳에서 관리하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-xl font-bold">🎵 Festival Tracker</a>
              <div className="flex gap-6">
                <a href="/" className="hover:underline">페스티벌</a>
                <a href="/stats" className="hover:underline">통계</a>
                <a href="/admin" className="hover:underline text-purple-600 dark:text-purple-400">관리자</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
