'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      window.location.replace('/dashboard');
    }
  }, [status]);

  return (
    <main className="min-h-[100svh] relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_300px_at_20%_10%,rgba(59,130,246,0.15),transparent),radial-gradient(500px_250px_at_80%_20%,rgba(99,102,241,0.15),transparent),radial-gradient(700px_350px_at_50%_90%,rgba(236,72,153,0.12),transparent)]" />

      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Med Memo AI
          </h1>
          <p className="text-slate-600 text-lg leading-7 mb-8">
            AIを活用して、暗記学習をもっと速く、もっとスマートに。単語帳・PDF穴埋め・AI問題作成をひとつに。
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signin" className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700">
              ログイン
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-white text-blue-700 font-medium border border-blue-200 shadow-sm hover:bg-blue-50">
              新規登録
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            登録は1分で完了。すぐに学習を始められます。
          </p>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] w-full rounded-3xl border border-slate-200 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-slate-700">直感的なUIと美しいデザインで、学習を快適に。</p>
              <p className="text-slate-500 text-sm mt-2">AI問題作成 / 単語帳 / PDF穴埋め</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="font-semibold mb-1">AI問題作成</h3>
          <p className="text-slate-600 text-sm">テキストから穴埋めやクイズを自動生成。</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-semibold mb-1">PDF穴埋め</h3>
          <p className="text-slate-600 text-sm">資料から重要ポイントを抽出して演習化。</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold mb-1">単語帳・カード</h3>
          <p className="text-slate-600 text-sm">シンプルで続けやすい復習体験。</p>
        </div>
      </section>
    </main>
  );
}
