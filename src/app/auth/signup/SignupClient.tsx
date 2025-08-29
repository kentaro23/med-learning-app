'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function SignupClient() {
  const { status } = useSession();
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') || '/dashboard';
  const [error, setError] = useState<string|null>(null);

  if (status === 'authenticated') { router.replace('/dashboard'); return null; }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')||'').trim();
    const password = String(f.get('password')||'');
    const name = String(f.get('name')||'');
    const school = String(f.get('school')||'');
    const res = await fetch('/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password, name, school }) });
    if (!res.ok) { setError('登録に失敗しました。既に登録済みの可能性があります。'); return; }
    await signIn('credentials', { email, password, redirect: true, callbackUrl });
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">新規登録</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div><label className="block text-sm mb-1">名前</label><input name="name" className="w-full border rounded p-2" /></div>
        <div><label className="block text-sm mb-1">学校</label><input name="school" className="w-full border rounded p-2" /></div>
        <div><label className="block text-sm mb-1">メールアドレス</label><input name="email" type="email" required className="w-full border rounded p-2" /></div>
        <div><label className="block text-sm mb-1">パスワード</label><input name="password" type="password" required className="w-full border rounded p-2" /></div>
        <button className="w-full border rounded p-2">登録する</button>
      </form>
      <p className="mt-4 text-sm">既にアカウントをお持ちの方は <a className="underline" href="/auth/signin">ログイン</a></p>
    </main>
  );
}


