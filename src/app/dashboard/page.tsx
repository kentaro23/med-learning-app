'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';

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

interface CardSet {
  id: string;
  title: string;
  description: string;
  tags: string;
  visibility: string;
  _count: { cards: number; likes: number; bookmarks: number };
  owner: { name: string };
  createdAt: string | Date;
}

interface UsageLimits {
  aiQuestionsGenerated: number;
  cardSetsStudied: number;
  pdfsProcessed: number;
  aiQuestionsLimit: number;
  cardSetsLimit: number;
  pdfsLimit: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCards: 0,
    totalCardSets: 0,
    totalDocs: 0,
    followers: 0,
    following: 0
  });
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [myCardSets, setMyCardSets] = useState<CardSet[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 Dashboard page mounted');
    
    // APIエンドポイントを使用して認証状態を確認
    const checkAuth = async () => {
      console.log('🔍 Checking authentication via API...');
      
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok && data.user) {
          console.log('✅ User authenticated:', data.user);
          setUser(data.user);
          
          // 統計情報も設定（デモ用）
          setStats({
            totalCards: 3,
            totalCardSets: 1,
            totalDocs: 0,
            followers: 0,
            following: 0
          });

          // 使用制限情報を取得
          const usageResponse = await fetch('/api/usage/summary');
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUsageLimits(usageData.usage);
          }
          
          console.log('✅ User info and stats set, setting loading to false');
          setIsLoading(false);
        } else {
          console.log('❌ User not authenticated, redirecting to intro');
          router.push('/intro');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        // エラーが発生した場合も、デフォルトユーザーとして表示
        console.log('🔄 Setting default user due to auth error');
        setUser({
          id: 'default-user',
          name: 'ユーザー',
          email: 'user@example.com'
        });
        setStats({
          totalCards: 0,
          totalCardSets: 0,
          totalDocs: 0,
          followers: 0,
          following: 0
        });
        setUsageLimits({
          aiQuestionsGenerated: 0,
          cardSetsStudied: 0,
          pdfsProcessed: 0,
          aiQuestionsLimit: 5,
          cardSetsLimit: 2,
          pdfsLimit: 1
        });
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">ダッシュボードを読み込み中...</h2>
          <p className="text-gray-600">しばらくお待ちください</p>
          <div className="mt-4 text-sm text-gray-500">
            <p>認証状態を確認中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Med Memo AI Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Welcome back, {user?.name}! 👋
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* ユーザープロフィールアイコン */}
            <Link
              href="/profile"
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg hover:shadow-lg transition-all duration-200"
            >
              {user?.name?.charAt(0) || 'U'}
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCards}</div>
            <div className="text-sm text-gray-600">作成したカード</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.totalCardSets}</div>
            <div className="text-sm text-gray-600">カードセット</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.totalDocs}</div>
            <div className="text-sm text-gray-600">PDF資料</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{stats.followers}</div>
            <div className="text-sm text-gray-600">フォロワー</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">{stats.following}</div>
            <div className="text-sm text-gray-600">フォロー中</div>
          </div>
        </div>

        {/* 統合検索バー */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">🔍 統合検索</h2>
            <p className="text-gray-600">
              単語帳、カード、PDF資料から必要な情報を素早く見つけましょう
            </p>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const query = formData.get('search') as string;
              if (query.trim()) {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }
            }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="search"
                  placeholder="キーワードを入力してください（例：循環器、解剖学、心臓...）"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg whitespace-nowrap"
              >
                検索
              </button>
            </div>
            <div className="mt-4 text-center">
              <Link 
                href="/search" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
              >
                詳細検索ページを開く →
              </Link>
            </div>
          </form>
        </div>

        {/* 使用制限情報 */}
        {usageLimits && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {user?.email === 'demo@med.ai' ? '今日の使用状況（デモ版：無制限）' : '今日の使用制限'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {user?.email === 'demo@med.ai' ? 
                    `${usageLimits.aiQuestionsGenerated} / 無制限` : 
                    `${usageLimits.aiQuestionsGenerated} / ${usageLimits.aiQuestionsLimit}`
                  }
                </div>
                <div className="text-gray-600 mb-2">AI問題生成</div>
                {user?.email === 'demo@med.ai' ? (
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((usageLimits.aiQuestionsGenerated / usageLimits.aiQuestionsLimit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  {user?.email === 'demo@med.ai' ? '無制限' : `残り${Math.max(0, usageLimits.aiQuestionsLimit - usageLimits.aiQuestionsGenerated)}回`}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {user?.email === 'demo@med.ai' ? 
                    `${usageLimits.cardSetsStudied} / 無制限` : 
                    `${usageLimits.cardSetsStudied} / ${usageLimits.cardSetsLimit}`
                  }
                </div>
                <div className="text-gray-600 mb-2">単語帳演習</div>
                {user?.email === 'demo@med.ai' ? (
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((usageLimits.cardSetsStudied / usageLimits.cardSetsLimit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  {user?.email === 'demo@med.ai' ? '無制限' : `残り${Math.max(0, usageLimits.cardSetsLimit - usageLimits.cardSetsStudied)}回`}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {user?.email === 'demo@med.ai' ? 
                    `${usageLimits.pdfsProcessed} / 無制限` : 
                    `${usageLimits.pdfsProcessed} / ${usageLimits.pdfsLimit}`
                  }
                </div>
                <div className="text-gray-600 mb-2">PDF処理</div>
                {user?.email === 'demo@med.ai' ? (
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full w-full"></div>
                  </div>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((usageLimits.pdfsProcessed / usageLimits.pdfsLimit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  {user?.email === 'demo@med.ai' ? '無制限' : `残り${Math.max(0, usageLimits.pdfsLimit - usageLimits.pdfsProcessed)}回`}
                </div>
              </div>
            </div>
            
            {user?.email !== 'demo@med.ai' && (
              <div className="mt-6 text-center">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">💎 プレミアムプラン</h3>
                  <p className="text-orange-700 text-sm mb-3">
                    プレミアムプランにアップグレードすると、全ての機能を無制限で利用できます
                  </p>
                  <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-medium">
                    アップグレード
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* メイン機能カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* AI問題作成 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">🤖</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">AI問題作成</h3>
              <p className="text-gray-600 mb-6">
                AIが最適な医学問題を自動生成。学習効率を最大化しましょう。
              </p>
            </div>
            <Link 
              href="/ai-questions"
              className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              問題を作成
            </Link>
          </div>

          {/* 単語帳・カードセット */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">📚</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">単語帳・カードセット</h3>
              <p className="text-gray-600 mb-6">
                フラッシュカードで効率的に学習。作成・共有・発見で学習を楽しく。
              </p>
            </div>
            <Link 
              href="/card-sets"
              className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              単語帳を見る
            </Link>
          </div>

          {/* PDF穴埋め問題 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">📄</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">PDF穴埋め問題</h3>
              <p className="text-gray-600 mb-6">
                PDFから穴埋め問題を自動生成。資料ごと共有して学習効率アップ。
              </p>
            </div>
            <Link 
              href="/pdf-cloze"
              className="block w-full bg-purple-600 text-white text-center py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              穴埋めを作成
            </Link>
          </div>
        </div>

        {/* 最近の活動 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最近の学習 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">最近の学習</h3>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <div className="text-blue-600">📖</div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">循環器 基礎</p>
                  <p className="text-sm text-gray-600">3枚のカードを学習</p>
                </div>
              </div>
              <div className="text-center text-gray-500 py-4">
                <p>まだ学習履歴が少ないです</p>
                <p className="text-sm mt-1">上記の機能を使って学習を始めましょう！</p>
              </div>
            </div>
          </div>

          {/* フォロー・フォロワー */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">コミュニティ</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <div className="text-green-600">👥</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">フォロワー</p>
                    <p className="text-sm text-gray-600">{stats.followers}人</p>
                  </div>
                </div>
                <Link href="/profile/followers" className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
                  管理
                </Link>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <div className="text-blue-600">🔍</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">フォロー中</p>
                    <p className="text-sm text-gray-600">{stats.following}人</p>
                  </div>
                </div>
                <Link href="/profile/following" className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
                  管理
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* リコメンド単語帳 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">🔥 おすすめ単語帳</h3>
            <Link 
              href="/card-sets/recommended" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
            >
              もっと見る
            </Link>
          </div>
          
          <div className="text-center text-gray-500 py-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-lg mb-2">リコメンド機能を準備中</p>
            <p className="text-sm">いいねの多い単語帳がここに表示されます</p>
          </div>
        </div>

        {/* 作成した単語帳 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">作成した単語帳</h3>
            <Link 
              href="/card-sets/create" 
              className="text-green-600 hover:text-green-700 text-sm font-medium hover:underline"
            >
              + 新しい単語帳を作成
            </Link>
          </div>
          
          {myCardSets.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg mb-2">まだ単語帳を作成していません</p>
              <p className="text-sm">新しい単語帳を作成して学習を始めましょう</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCardSets.map((cardSet) => (
                <div key={cardSet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 line-clamp-2">{cardSet.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cardSet.visibility === 'public' ? 'bg-green-100 text-green-800' :
                      cardSet.visibility === 'unlisted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cardSet.visibility === 'public' ? '公開' : 
                       cardSet.visibility === 'unlisted' ? '限定公開' : '非公開'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{cardSet.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>カード: {cardSet._count.cards}枚</span>
                    <span>いいね: {cardSet._count.likes}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/card-sets/${cardSet.id}`}
                      className="flex-1 bg-green-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      学習開始
                    </Link>
                    <Link
                      href={`/card-sets/${cardSet.id}/add-cards`}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      編集
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/ai-questions" className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-sm font-medium text-blue-900">新規問題作成</p>
            </Link>
            <Link href="/card-sets" className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-2">➕</div>
              <p className="text-sm font-medium text-green-900">カードセット作成</p>
            </Link>
            <Link href="/pdf-cloze" className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-2xl mb-2">📤</div>
              <p className="text-sm font-medium text-purple-900">PDFアップロード</p>
            </Link>
            <Link href="/card-sets" className="text-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm font-medium text-orange-900">学習セッション開始</p>
            </Link>
            <Link href="/search" className="text-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm font-medium text-indigo-900">統合検索</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
