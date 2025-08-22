'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';

interface Follower {
  id: string;
  name: string;
  email: string;
  university?: string;
  grade?: string;
  major?: string;
  avatar?: string;
  isFollowingBack: boolean;
  followedAt: string;
}

// デモ用のフォロワーデータ
const mockFollowers: Follower[] = [
  {
    id: 'follower1',
    name: '田中 花子',
    email: 'hanako@med.ai',
    university: '東京医科大学',
    grade: '3年生',
    major: '医学部',
    avatar: '🌸',
    isFollowingBack: true,
    followedAt: '2024-08-15T10:30:00Z'
  },
  {
    id: 'follower2',
    name: '佐藤 太郎',
    email: 'taro@med.ai',
    university: '大阪医科大学',
    grade: '2年生',
    major: '医学部',
    avatar: '🌿',
    isFollowingBack: false,
    followedAt: '2024-08-14T15:45:00Z'
  },
  {
    id: 'follower3',
    name: '鈴木 美咲',
    email: 'misaki@med.ai',
    university: '名古屋医科大学',
    grade: '4年生',
    major: '医学部',
    avatar: '⭐',
    isFollowingBack: true,
    followedAt: '2024-08-13T09:15:00Z'
  },
  {
    id: 'follower4',
    name: '高橋 健太',
    email: 'kenta@med.ai',
    university: '福岡医科大学',
    grade: '1年生',
    major: '医学部',
    avatar: '🔥',
    isFollowingBack: false,
    followedAt: '2024-08-12T14:20:00Z'
  },
  {
    id: 'follower5',
    name: '渡辺 愛',
    email: 'ai@med.ai',
    university: '札幌医科大学',
    grade: '5年生',
    major: '医学部',
    avatar: '💖',
    isFollowingBack: true,
    followedAt: '2024-08-11T11:00:00Z'
  }
];

export default function FollowersPage() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mutual' | 'not-mutual'>('all');

  useEffect(() => {
    // デモデータを設定
    setFollowers(mockFollowers);
    setIsLoading(false);
  }, []);

  const filteredFollowers = followers.filter(follower => {
    const matchesSearch = follower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         follower.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         follower.major?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'mutual' && follower.isFollowingBack) ||
                         (filterType === 'not-mutual' && !follower.isFollowingBack);
    
    return matchesSearch && matchesFilter;
  });

  const handleFollowBack = async (followerId: string) => {
    // フォロー返しの処理（将来的にAPIと連携）
    setFollowers(prev => 
      prev.map(follower => 
        follower.id === followerId 
          ? { ...follower, isFollowingBack: true }
          : follower
      )
    );
  };

  const handleRemoveFollower = async (followerId: string) => {
    // フォロワーを削除する処理（将来的にAPIと連携）
    if (confirm('このフォロワーを削除しますか？')) {
      setFollowers(prev => prev.filter(follower => follower.id !== followerId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">フォロワーを読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">👥 フォロワー管理</h1>
              <p className="text-xl text-gray-600">
                あなたをフォローしているユーザーを管理しましょう
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
            <div className="text-2xl font-bold text-purple-600">{followers.length}</div>
            <div className="text-sm text-gray-600">総フォロワー数</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {followers.filter(f => f.isFollowingBack).length}
            </div>
            <div className="text-sm text-gray-600">相互フォロー</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {followers.filter(f => !f.isFollowingBack).length}
            </div>
            <div className="text-sm text-gray-600">片思いフォロー</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((followers.filter(f => f.isFollowingBack).length / followers.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">相互フォロー率</div>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                placeholder="名前、大学、専攻で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フィルター
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'mutual' | 'not-mutual')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="mutual">相互フォロー</option>
                <option value="not-mutual">片思いフォロー</option>
              </select>
            </div>
          </div>
        </div>

        {/* フォロワー一覧 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            フォロワー一覧 ({filteredFollowers.length}人)
          </h2>
          
          {filteredFollowers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">フォロワーが見つかりません</h3>
              <p className="text-gray-600">検索条件を変更してみてください</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFollowers.map((follower) => (
                <div key={follower.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {follower.avatar || follower.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{follower.name}</h3>
                      <p className="text-sm text-gray-600">{follower.university} {follower.grade}</p>
                      <p className="text-sm text-gray-500">{follower.major}</p>
                      <p className="text-xs text-gray-400">フォロー開始: {formatDate(follower.followedAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {follower.isFollowingBack ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        相互フォロー
                      </span>
                    ) : (
                      <button
                        onClick={() => handleFollowBack(follower.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        フォロー返し
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleRemoveFollower(follower.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      削除
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
