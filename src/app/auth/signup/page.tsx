'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SignUpPage() {
  const router = useRouter();
  const { status } = useSession();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') || '/dashboard';

  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') {
    router.replace('/dashboard');
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const name = String(data.get('name') || '');
    const school = String(data.get('school') || '');

    // サインアップAPIへ
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, school }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 409) {
      // 既存ユーザーの場合はログイン画面へ誘導
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(email)}`);
      return;
    }

    if (!res.ok) {
      setError('登録に失敗しました。既に登録済みの可能性があります。');
      return;
    }

    // 成功したら自動ログインしてダッシュボードへ
    await signIn('credentials', { email, password, redirect: true, callbackUrl });
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">新規登録</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">名前</label>
          <input name="name" type="text" className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">学校</label>
          <input name="school" type="text" className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">メールアドレス</label>
          <input name="email" type="email" required className="w-full border rounded p-2" autoComplete="email" />
        </div>
        <div>
          <label className="block text-sm mb-1">パスワード</label>
          <input name="password" type="password" required className="w-full border rounded p-2" autoComplete="new-password" />
        </div>
        <button type="submit" className="w-full border rounded p-2">登録する</button>
      </form>
      <p className="mt-4 text-sm">
        既にアカウントをお持ちの方は <a className="underline" href="/auth/signin">ログイン</a>
      </p>
    </main>
  );
}
