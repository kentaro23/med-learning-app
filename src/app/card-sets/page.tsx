import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Navigation from '../../components/Navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 仮のデータ（後でAPIから取得）
const mockCardSets = [
  {
    id: '1',
    title: '心臓血管系の基礎',
    description: '心臓の構造と機能について',
    tags: '心臓,循環器,解剖学',
    visibility: 'public',
    _count: { cards: 15, likes: 8, bookmarks: 12 },
    owner: { name: '医学生A' },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: '神経学の重要ポイント',
    description: '神経系の診断と治療',
    tags: '神経学,診断,治療',
    visibility: 'public',
    _count: { cards: 20, likes: 15, bookmarks: 18 },
    owner: { name: '医学生B' },
    createdAt: new Date('2024-01-10'),
  },
];

export default async function CardSetsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  // サーバーサイドでカードセットを取得
  const allCardSets = await prisma.cardSet.findMany({
    where: { visibility: 'public' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      visibility: true,
      createdAt: true,
      _count: {
        select: {
          cards: true,
          likes: true,
          bookmarks: true,
        }
      },
      owner: {
        select: {
          name: true,
        }
      }
    }
  });

  // ユーザーのカードセットを取得
  const myCardSets = await prisma.cardSet.findMany({
    where: { ownerId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      visibility: true,
      createdAt: true,
      _count: {
        select: {
          cards: true,
          likes: true,
          bookmarks: true,
        }
      },
      owner: {
        select: {
          name: true,
        }
      }
    }
  });

  // 現在はallタブのみ表示（my, addedタブは後で実装）
  const cardSets = allCardSets;

  // 安全な日付表示関数
  const formatDate = (dateValue: string | Date) => {
    try {
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleDateString('ja-JP');
      } else if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString('ja-JP');
      }
      return '日付不明';
    } catch (error) {
      return '日付不明';
    }
  };

  const visibilityLabels = {
    all: 'すべて',
    public: '公開',
    unlisted: '限定公開',
    private: '非公開'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">単語帳・カードセット</h1>
          <p className="text-gray-600">効率的な暗記学習で医学知識を身につけましょう</p>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="単語帳を検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">すべての公開設定</option>
              <option value="public">公開</option>
              <option value="unlisted">限定公開</option>
            </select>
            <Link
              href="/card-sets/create"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              + 新規作成
            </Link>
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex space-x-1 mb-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              すべて
            </button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              マイ単語帳
            </button>
            <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              追加済み
            </button>
          </div>

          {/* カードセット一覧 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardSets.map((cardSet) => (
              <div key={cardSet.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {cardSet.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      cardSet.visibility === 'public' ? 'bg-green-100 text-green-800' :
                      cardSet.visibility === 'unlisted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {visibilityLabels[cardSet.visibility as keyof typeof visibilityLabels]}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {cardSet.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {cardSet.tags?.split(',').map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>作成者: {cardSet.owner.name}</span>
                    <span>{formatDate(cardSet.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {cardSet._count.cards}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {cardSet._count.likes}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {cardSet._count.bookmarks}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/card-sets/${cardSet.id}`}
                      className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      学習開始
                    </Link>
                    <button 
                      className="px-3 py-2 border border-gray-300 rounded-lg transition-all duration-200 transform hover:scale-105 hover:bg-gray-100 hover:border-gray-400"
                    >
                      <svg className="w-5 h-5 fill-none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cardSets.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-lg mb-2">カードセットが見つかりません</p>
              <p>検索条件を変更するか、新しいカードセットを作成してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
