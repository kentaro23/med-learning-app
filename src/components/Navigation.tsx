'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  const isActive = (path: string) => {
    return pathname === path;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ・ブランド */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Med Memo AI</span>
            </Link>
          </div>

          {/* ナビゲーションリンク */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ダッシュボード
            </Link>
            <Link
              href="/ai-questions"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/ai-questions')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              AI問題作成
            </Link>
            <Link
              href="/card-sets"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/card-sets')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              単語帳
            </Link>
            <Link
              href="/pdf-cloze"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/pdf-cloze')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              PDF穴埋め
            </Link>
            <Link
              href="/search"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/search')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🔍 検索
            </Link>
            <Link
              href="/messages"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/messages')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              💬 メッセージ
            </Link>
          </div>

          {/* ユーザーメニュー */}
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:shadow-lg transition-all duration-200"
            >
              {user?.name?.charAt(0) || 'U'}
            </Link>
            <button
              onClick={() => {
                document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                window.location.href = '/intro';
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
