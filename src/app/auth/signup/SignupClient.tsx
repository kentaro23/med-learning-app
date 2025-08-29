'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function SignupClient() {
  const { status } = useSession();
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = (typeof window !== 'undefined')
    ? (sp.get('callbackUrl') || new URL('/dashboard', window.location.origin).toString())
    : '/dashboard';

  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') { router.replace('/dashboard'); return null; }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setLoading(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')||'').trim();
    const password = String(f.get('password')||'');
    const name = String(f.get('name')||'');
    const school = String(f.get('school')||'');
    const res = await fetch('/api/auth/signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password, name, school })
    });
    setLoading(false);
    if (!res.ok) { setError('登録に失敗しました。既に登録済みの可能性があります。'); return; }
    const sig = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    if (!sig || (sig as any).error) { setError('自動ログインに失敗しました。ログイン画面からお試しください。'); return; }
    if ((sig as any).url) router.replace((sig as any).url as string);
    else router.replace('/dashboard');
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-[960px] grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <div className="aspect-[4/3] w-full rounded-3xl shadow-lg bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.25),transparent_50%)] border border-slate-200 flex items-center justify-center">
            <div className="text-slate-600 text-lg font-medium px-8 text-center">
              数分で登録完了。<br />マルチデバイスで単語帳を継続。
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">新規登録</h1>
          <p className="text-slate-600 mb-6 text-sm">必要事項を入力してください。登録後すぐにご利用いただけます。</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div><label className="block text-sm mb-1">名前</label>
              <input name="name" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm mb-1">学校</label>
              <input name="school" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm mb-1">メールアドレス</label>
              <input name="email" type="email" required autoComplete="email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm mb-1">パスワード</label>
              <input name="password" type="password" required autoComplete="new-password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" /></div>
            <button disabled={loading}
              className="w-full rounded-lg px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? '登録処理中…' : '登録する'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            既にアカウントをお持ちの方は <a className="underline decoration-blue-500 underline-offset-4" href="/auth/signin">ログイン</a>
          </p>
        </div>
      </div>
    </div>
  );
}



