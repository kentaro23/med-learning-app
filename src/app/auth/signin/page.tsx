'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') || '/dashboard';

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 認証済みなら dashboard へ（ここでだけ実施）
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  if (status === 'authenticated') return null; // すぐにリダイレクト

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl,
    });

    // next-auth がリダイレクトするのでここに来ない想定だが、失敗時は res?.error が入る
    if (res && (res as any).error) {
      setError('メールアドレスまたはパスワードが正しくありません。');
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">ログイン</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">メールアドレス</label>
          <input name="email" type="email" required className="w-full border rounded p-2" autoComplete="email" />
        </div>
        <div>
          <label className="block text-sm mb-1">パスワード</label>
          <input name="password" type="password" required className="w-full border rounded p-2" autoComplete="current-password" />
        </div>
        <button type="submit" className="w-full border rounded p-2">ログイン</button>
      </form>
      <p className="mt-4 text-sm">
        アカウントがない方は <a className="underline" href="/auth/signup">新規登録</a>
      </p>
    </main>
  );
}
