'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';

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

export default function RecommendedCardSetsPage() {
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // リコメンド単語帳を取得
  useEffect(() => {
    const fetchRecommendedCardSets = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/card-sets/recommended');
        if (response.ok) {
          const data = await response.json();
          setCardSets(data.cardSets || []);
        } else {
          console.error('Error fetching recommended card sets');
        }
      } catch (error) {
        console.error('Error fetching recommended card sets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedCardSets();
  }, []);

  const visibilityLabels = {
    public: '公開',
    unlisted: '限定公開',
    private: '非公開',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔥 おすすめ単語帳</h1>
              <p className="text-gray-600 mt-2">
                いいねの多い人気単語帳を発見しましょう
              </p>
            </div>
            <Link
              href="/card-sets"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              単語帳一覧に戻る
            </Link>
          </div>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">おすすめ単語帳を読み込み中...</p>
          </div>
        )}

        {/* リコメンド単語帳一覧 */}
        {!isLoading && cardSets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔥</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">まだおすすめ単語帳がありません</h3>
            <p className="text-gray-600">
              単語帳にいいねを押して、人気の単語帳を作りましょう！
            </p>
          </div>
        ) : (
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
                    {cardSet.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
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
                    <span>カード: {cardSet._count.cards}枚</span>
                    <span className="flex items-center gap-1 text-orange-600">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {cardSet._count.likes}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/card-sets/${cardSet.id}`}
                      className="flex-1 bg-orange-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-orange-700 transition-colors"
                    >
                      学習開始
                    </Link>
                    <Link
                      href={`/card-sets/${cardSet.id}/add-cards`}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      詳細
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
