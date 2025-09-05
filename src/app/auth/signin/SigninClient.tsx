'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

function useCallbackUrl(sp: ReturnType<typeof useSearchParams>) {
  return useMemo(() => {
    const cb = sp.get('callbackUrl');
    if (cb) return cb;
    if (typeof window !== 'undefined') return new URL('/dashboard', window.location.origin).toString();
    return '/dashboard';
  }, [sp]);
}

export default function SigninClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = useCallbackUrl(sp);
  const [error, setError] = useState<string|null>(sp.get('error') ? 'メールアドレスまたはパスワードが正しくありません。' : null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setLoading(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')||'').trim();
    const password = String(f.get('password')||'');
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (!res || (res as any).error) { setError('メールアドレスまたはパスワードが正しくありません。'); return; }
    if ((res as any).url) router.replace((res as any).url as string);
    else router.replace('/dashboard');
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-[960px] grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <div className="aspect-[4/3] w-full rounded-3xl shadow-lg bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.25),transparent_50%)] border border-slate-200 flex items-center justify-center">
            <div className="text-slate-600 text-lg font-medium px-8 text-center">
              学習を、もっと美しく・速く。<br />あなたの単語帳をクラウドで管理。
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">ログイン</h1>
          <p className="text-slate-600 mb-6 text-sm">アカウントにサインインして学習をはじめましょう。</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">メールアドレス</label>
              <input name="email" type="email" required autoComplete="email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm mb-1">パスワード</label>
              <input name="password" type="password" required autoComplete="current-password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button disabled={loading}
              className="w-full rounded-lg px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'サインイン中…' : 'ログイン'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            アカウントがない方は <a className="underline decoration-blue-500 underline-offset-4" href="/auth/signup">新規登録</a>
          </p>
        </div>
      </div>
    </div>
  );
}



