import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "SBS아카데미 분당점 - 고객 관리 시스템",
  description: "학원 영업팀 통화 기반 고객 관리 자동화",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen">
          <NavBar />
          <main>{children}</main>
        </div>

        {/* Keyboard shortcut handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('keydown', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
                if (e.key === 'u' || e.key === 'U') { window.location.href = '/upload'; }
                if (e.key === 'b' || e.key === 'B') { window.location.href = '/board'; }
                if (e.key === 'd' || e.key === 'D') { window.location.href = '/'; }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
