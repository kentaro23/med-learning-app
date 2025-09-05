'use client';
import { Suspense } from 'react';
import SigninClient from './SigninClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">読み込み中...</div>}>
      <SigninClient />
    </Suspense>
  );
}
