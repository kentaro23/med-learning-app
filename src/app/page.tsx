'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    // セッションクッキーの存在を確認
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => 
        cookie.trim().startsWith('next-auth.session-token=')
      );

      if (!sessionCookie) {
        console.log('❌ No session cookie found, redirecting to intro');
        router.push('/intro');
        return;
      }

      console.log('✅ Session cookie found, redirecting to dashboard...');
      
      // セッションクッキーが存在する場合、ダッシュボードにリダイレクト
      router.push('/dashboard');
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    // セッションクッキーを削除
    document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/intro');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Med Memo AI
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome, {userName}!
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/ai-questions" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-blue-600 text-2xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI問題作成</h3>
              <p className="text-gray-600 text-sm">
                AIが最適な医学問題を作成します
              </p>
            </div>
          </Link>

          <Link href="/card-sets" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-green-600 text-2xl mb-3">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">単語帳・カードセット</h3>
              <p className="text-gray-600 text-sm">
                フラッシュカードで効率的に学習
              </p>
            </div>
          </Link>

          <Link href="/pdf-cloze" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="text-purple-600 text-2xl mb-3">📄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF穴埋め問題</h3>
              <p className="text-gray-600 text-sm">
                PDFから穴埋め問題を自動生成
              </p>
            </div>
          </Link>
        </div>

        {/* 最近の学習 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">最近の学習</h2>
          <div className="text-gray-500 text-center py-8">
            <p>まだ学習履歴がありません</p>
            <p className="text-sm mt-2">上記の機能を使って学習を始めましょう！</p>
          </div>
        </div>
      </div>
    </div>
  );
}
