'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const { status } = useSession();

  useEffect(() => {
    // 認証済みならダッシュボードへ
    if (status === 'authenticated') {
      window.location.replace('/dashboard');
    }
  }, [status]);

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Med Memo AI</h1>
      <p className="text-slate-600 mb-6">まずはログインまたは新規登録してください。</p>
      <div className="space-y-3">
        <a className="block w-full border rounded p-3 text-center" href="/auth/signin">ログイン</a>
        <a className="block w-full border rounded p-3 text-center" href="/auth/signup">新規登録</a>
      </div>
    </main>
  );
}
