'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';

interface Following {
  id: string;
  name: string;
  email: string;
  university?: string;
  grade?: string;
  major?: string;
  avatar?: string;
  isFollowingBack: boolean;
  followedAt: string;
  lastActive: string;
}

// デモ用のフォロー中データ
const mockFollowing: Following[] = [
  {
    id: 'following1',
    name: '山田 次郎',
    email: 'jiro@med.ai',
    university: '京都医科大学',
    grade: '4年生',
    major: '医学部',
    avatar: '🌙',
    isFollowingBack: true,
    followedAt: '2024-08-10T08:30:00Z',
    lastActive: '2024-08-22T15:20:00Z'
  },
  {
    id: 'following2',
    name: '伊藤 さくら',
    email: 'sakura@med.ai',
    university: '神戸医科大学',
    grade: '2年生',
    major: '医学部',
    avatar: '🌸',
    isFollowingBack: false,
    followedAt: '2024-08-09T12:15:00Z',
    lastActive: '2024-08-21T10:45:00Z'
  },
  {
    id: 'following3',
    name: '中村 大輔',
    email: 'daisuke@med.ai',
    university: '広島医科大学',
    grade: '5年生',
    major: '医学部',
    avatar: '⚡',
    isFollowingBack: true,
    followedAt: '2024-08-08T16:40:00Z',
    lastActive: '2024-08-22T14:30:00Z'
  },
  {
    id: 'following4',
    name: '小林 麻衣',
    email: 'mai@med.ai',
    university: '仙台医科大学',
    grade: '1年生',
    major: '医学部',
    avatar: '🌺',
    isFollowingBack: true,
    followedAt: '2024-08-07T09:20:00Z',
    lastActive: '2024-08-22T11:15:00Z'
  },
  {
    id: 'following5',
    name: '加藤 雄太',
    email: 'yuta@med.ai',
    university: '熊本医科大学',
    grade: '3年生',
    major: '医学部',
    avatar: '🌊',
    isFollowingBack: false,
    followedAt: '2024-08-06T13:50:00Z',
    lastActive: '2024-08-20T16:20:00Z'
  },
  {
    id: 'following6',
    name: '松本 美優',
    email: 'miyu@med.ai',
    university: '新潟医科大学',
    grade: '6年生',
    major: '医学部',
    avatar: '🌟',
    isFollowingBack: true,
    followedAt: '2024-08-05T11:25:00Z',
    lastActive: '2024-08-22T09:10:00Z'
  }
];

export default function FollowingPage() {
  const [following, setFollowing] = useState<Following[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mutual' | 'not-mutual'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'followedAt' | 'lastActive'>('followedAt');

  useEffect(() => {
    // デモデータを設定
    setFollowing(mockFollowing);
    setIsLoading(false);
  }, []);

  const filteredAndSortedFollowing = following
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.major?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'mutual' && user.isFollowingBack) ||
                           (filterType === 'not-mutual' && !user.isFollowingBack);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'followedAt':
          return new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime();
        case 'lastActive':
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        default:
          return 0;
      }
    });

  const handleUnfollow = async (userId: string) => {
    // フォロー解除の処理（将来的にAPIと連携）
    if (confirm('このユーザーのフォローを解除しますか？')) {
      setFollowing(prev => prev.filter(user => user.id !== userId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatLastActive = (dateString: string) => {
    const now = new Date();
    const lastActive = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '1時間以内';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}日前`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">フォロー中を読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">👀 フォロー中管理</h1>
              <p className="text-xl text-gray-600">
                あなたがフォローしているユーザーを管理しましょう
              </p>
            </div>
            <Link
              href="/profile"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              プロフィールに戻る
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{following.length}</div>
            <div className="text-sm text-gray-600">総フォロー数</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {following.filter(f => f.isFollowingBack).length}
            </div>
            <div className="text-sm text-gray-600">相互フォロー</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">
              {following.filter(f => !f.isFollowingBack).length}
            </div>
            <div className="text-sm text-gray-600">片思いフォロー</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((following.filter(f => f.isFollowingBack).length / following.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">相互フォロー率</div>
          </div>
        </div>

        {/* 検索・フィルター・ソート */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                placeholder="名前、大学、専攻で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フィルター
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'mutual' | 'not-mutual')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="mutual">相互フォロー</option>
                <option value="not-mutual">片思いフォロー</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ソート
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'followedAt' | 'lastActive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="followedAt">フォロー日順</option>
                <option value="name">名前順</option>
                <option value="lastActive">最終アクティブ順</option>
              </select>
            </div>
          </div>
        </div>

        {/* フォロー中一覧 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            フォロー中一覧 ({filteredAndSortedFollowing.length}人)
          </h2>
          
          {filteredAndSortedFollowing.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-gray-400 text-6xl mb-4">👀</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">フォロー中のユーザーが見つかりません</h3>
              <p className="text-gray-600">検索条件を変更してみてください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedFollowing.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.avatar || user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.university} {user.grade}</p>
                      <p className="text-sm text-gray-500">{user.major}</p>
                      <p className="text-xs text-gray-400">フォロー開始: {formatDate(user.followedAt)}</p>
                      <p className="text-xs text-gray-400">最終アクティブ: {formatLastActive(user.lastActive)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {user.isFollowingBack ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        相互フォロー
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                        片思いフォロー
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleUnfollow(user.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      フォロー解除
                    </button>
                    
                    {/* 将来的なDMボタン */}
                    <button className="px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                      💬 DM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
