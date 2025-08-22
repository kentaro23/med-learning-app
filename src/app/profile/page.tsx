'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  university?: string;
  grade?: string;
  major?: string;
  subscriptionType?: string;
  subscriptionExpiresAt?: string;
}

interface Stats {
  totalCards: number;
  totalCardSets: number;
  totalDocs: number;
  followers: number;
  following: number;
}

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCards: 0,
    totalCardSets: 0,
    totalDocs: 0,
    followers: 0,
    following: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    university: '',
    major: '',
    grade: ''
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok && data.user) {
          setUser(data.user);
          setEditForm({
            university: data.user.university || '',
            major: data.user.major || '',
            grade: data.user.grade || ''
          });
          
          // 統計情報も設定（デモ用）
          setStats({
            totalCards: 3,
            totalCardSets: 1,
            totalDocs: 0,
            followers: 0,
            following: 0
          });
          
          setIsLoading(false);
        } else {
          router.push('/intro');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/intro');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSave = async () => {
    // ここでプロフィール更新APIを呼び出す
    console.log('Saving profile:', editForm);
    setIsEditing(false);
    // TODO: 実際のAPI呼び出しを実装
  };

  const handleCancel = () => {
    setEditForm({
      university: user?.university || '',
      major: user?.major || '',
      grade: user?.grade || ''
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">プロフィールを読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">プロフィール</h1>
            <p className="text-xl text-gray-600">ユーザー情報の管理</p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ダッシュボードに戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：プロフィール基本情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* プロフィール画像・基本情報 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600 text-lg">{user?.email}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user?.email === 'demo@med.ai' 
                        ? 'bg-green-100 text-green-800' 
                        : user?.subscriptionType === 'premium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.email === 'demo@med.ai' ? 'デモ版（無制限）' : 
                       user?.subscriptionType === 'premium' ? 'プレミアム' : '無料プラン'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 大学・専攻・学年情報 */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">🏫 大学・専攻情報</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isEditing ? 'キャンセル' : '編集'}
                  </button>
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">大学名</label>
                      <input
                        type="text"
                        value={editForm.university}
                        onChange={(e) => setEditForm({...editForm, university: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：東京医科大学"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">専攻</label>
                      <input
                        type="text"
                        value={editForm.major}
                        onChange={(e) => setEditForm({...editForm, major: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：医学部"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">学年</label>
                      <input
                        type="text"
                        value={editForm.grade}
                        onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：3年生"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">大学</div>
                      <div className="font-medium text-gray-900">{user?.university || '未設定'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">専攻</div>
                      <div className="font-medium text-gray-900">{user?.major || '未設定'}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">学年</div>
                      <div className="font-medium text-gray-900">{user?.grade || '未設定'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* サブスクリプション情報 */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">💎 サブスクリプション情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-2">現在のプラン</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {user?.email === 'demo@med.ai' ? 'デモ版（無制限）' : 
                     user?.subscriptionType === 'premium' ? 'プレミアム' : '無料プラン'}
                  </div>
                  <p className="text-sm text-gray-600">
                    {user?.email === 'demo@med.ai' 
                      ? '全ての機能を無制限で利用できます' 
                      : user?.subscriptionType === 'premium'
                      ? '全ての機能を無制限で利用できます'
                      : '一部機能に制限があります'}
                  </p>
                </div>
                
                {user?.subscriptionExpiresAt && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-2">有効期限</h4>
                    <div className="text-2xl font-bold text-orange-600 mb-2">
                      {new Date(user.subscriptionExpiresAt).toLocaleDateString('ja-JP')}
                    </div>
                    <p className="text-sm text-gray-600">プレミアムプランの有効期限</p>
                  </div>
                )}
              </div>
              
              {user?.email !== 'demo@med.ai' && user?.subscriptionType !== 'premium' && (
                <div className="mt-6 text-center">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-orange-800 mb-2">プレミアムプランにアップグレード</h4>
                    <p className="text-orange-700 text-sm mb-4">
                      プレミアムプランにアップグレードすると、全ての機能を無制限で利用できます
                    </p>
                    <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-medium">
                      アップグレード
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右側：統計・フォロー情報 */}
          <div className="space-y-6">
            {/* 統計情報 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 統計情報</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">作成したカード</span>
                  <span className="font-bold text-blue-600">{stats.totalCards}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">カードセット</span>
                  <span className="font-bold text-green-600">{stats.totalCardSets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">PDF資料</span>
                  <span className="font-bold text-purple-600">{stats.totalDocs}</span>
                </div>
              </div>
            </div>

            {/* フォロー・フォロワー情報 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 コミュニティ</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">フォロワー</div>
                      <div className="text-2xl font-bold text-green-600">{stats.followers}</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      管理
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">フォロー中</div>
                      <div className="text-2xl font-bold text-blue-600">{stats.following}</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      管理
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* クイックアクション */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ クイックアクション</h3>
              <div className="space-y-3">
                <Link href="/ai-questions" className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  AI問題作成
                </Link>
                <Link href="/card-sets" className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
                  単語帳学習
                </Link>
                <Link href="/pdf-cloze" className="block w-full bg-purple-600 text-white text-center py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                  PDF穴埋め
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
