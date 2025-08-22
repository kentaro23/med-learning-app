import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Med Memo AI - 医学学習をAIで効率化",
  description: "AIによる問題作成、単語帳、PDF穴埋めで医学学習を効率化するプラットフォーム",
  keywords: "医学,学習,AI,問題作成,単語帳,PDF,穴埋め",
  authors: [{ name: "Med Memo AI Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
