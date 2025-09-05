'use client';
import { Suspense } from 'react';
import SignupClient from './SignupClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">読み込み中...</div>}>
      <SignupClient />
    </Suspense>
  );
}
