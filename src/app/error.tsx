'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            エラーが発生しました
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          
          {error.digest && (
            <p className="mt-2 text-xs text-gray-500">
              エラーID: {error.digest}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                以下の方法をお試しください：
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  再試行
                </button>
                
                <Link
                  href="/intro"
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium inline-block text-center"
                >
                  ホームに戻る
                </Link>
                
                <Link
                  href="/auth/signin"
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium inline-block text-center"
                >
                  ログイン画面
                </Link>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <details className="text-sm text-gray-600">
                <summary className="cursor-pointer hover:text-gray-800">
                  エラーの詳細
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono overflow-auto">
                  {error.message}
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
