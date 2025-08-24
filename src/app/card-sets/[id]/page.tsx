'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Card {
  id: string;
  question: string;
  answer: string;
  source?: string;
}

interface CardSet {
  id: string;
  title: string;
  description: string;
  tags: string;
  visibility: string;
  _count: { cards: number; likes: number; bookmarks: number };
  owner: { name: string };
  createdAt: Date;
}

// 仮のデータ（後でAPIから取得）
const mockCardSet: CardSet = {
  id: '2',
  title: '神経学の重要ポイント',
  description: '神経系の診断と治療',
  tags: '神経学,診断,治療',
  visibility: 'public',
  _count: { cards: 20, likes: 15, bookmarks: 18 },
  owner: { name: '医学生B' },
  createdAt: new Date('2024-01-10'),
};

const mockCards: Card[] = [
  {
    id: '1',
    question: '脳梗塞の初期症状として最も重要なのは？',
    answer: '片麻痺',
    source: '脳梗塞では片側の運動麻痺が最も特徴的な初期症状です。'
  },
  {
    id: '2',
    question: 'パーキンソン病の三大症状は？',
    answer: '振戦、筋固縮、無動',
    source: 'パーキンソン病の主要症状として知られています。'
  },
  {
    id: '3',
    question: '多発性硬化症の特徴的な所見は？',
    answer: '時間的多発性と空間的多発性',
    source: '時間的・空間的に多発する脱髄病変が特徴です。'
  }
];

export default function CardSetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyResults, setStudyResults] = useState<{ [key: string]: 'correct' | 'incorrect' | 'skip' }>({});
  const [studyStartTime, setStudyStartTime] = useState<number>(0);
  const [cardSet, setCardSet] = useState<CardSet | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

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

  // いいねボタンのクリックハンドラー
  const handleLikeClick = async () => {
    if (!cardSet) return;
    
    try {
      // 即座にUIを更新（楽観的更新）
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      
      if (newLikedState) {
        setLikeCount(prev => prev + 1);
      } else {
        setLikeCount(prev => Math.max(0, prev - 1));
      }
      
      // API呼び出し
      const response = await fetch(`/api/card-sets/${cardSet.id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        // APIの結果に基づいて状態を最終確定
        setIsLiked(data.liked);
        setLikeCount(data.liked ? likeCount + 1 : Math.max(0, likeCount - 1));
      } else {
        // APIエラー時は元の状態に戻す
        setIsLiked(!newLikedState);
        setLikeCount(newLikedState ? Math.max(0, likeCount - 1) : likeCount + 1);
      }
    } catch (error) {
      // エラー時は元の状態に戻す
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
    }
  };

  // データベースから単語帳とカードの情報を取得
  useEffect(() => {
    const fetchCardSetData = async () => {
      try {
        const cardSetId = params.id as string;
        
        // 単語帳の基本情報を取得
        const cardSetResponse = await fetch(`/api/card-sets/${cardSetId}`);
        console.log('CardSet Response Status:', cardSetResponse.status);
        if (cardSetResponse.ok) {
          const cardSetData = await cardSetResponse.json();
          console.log('CardSet Data:', cardSetData);
          setCardSet(cardSetData.cardSet);
          setLikeCount(cardSetData.cardSet._count.likes);
          
          // いいねの状態を取得
          try {
            const likeResponse = await fetch(`/api/card-sets/${cardSetId}/like`);
            if (likeResponse.ok) {
              const likeData = await likeResponse.json();
              console.log('✅ Like status fetched:', likeData);
              setIsLiked(likeData.liked);
            } else {
              console.log('⚠️ Like status fetch failed, setting default');
              setIsLiked(false);
            }
          } catch (error) {
            console.log('⚠️ Like status fetch error, setting default');
            setIsLiked(false);
          }
        } else {
          const errorData = await cardSetResponse.json();
          console.error('CardSet API Error:', errorData);
        }

        // カード一覧を取得
        const cardsResponse = await fetch(`/api/card-sets/${cardSetId}/cards`);
        console.log('Cards Response Status:', cardsResponse.status);
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          console.log('Cards Data:', cardsData);
          setCards(cardsData.cards);
        } else {
          const errorData = await cardsResponse.json();
          console.error('Cards API Error:', errorData);
        }
      } catch (error) {
        console.error('Error fetching card set data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchCardSetData();
    }
  }, [params.id]);

  // ローディング中またはデータが取得できていない場合
  if (isLoading || !cardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }



  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      // 学習完了 - 結果画面にリダイレクト
      completeStudy();
    }
  };

  const completeStudy = () => {
    // 学習結果を整形
    const results = cards.map(card => ({
      cardId: card.id,
      result: studyResults[card.id] || 'skip',
      question: card.question,
      answer: card.answer,
              source: card.source
    }));

    // 学習時間を計算（秒）
    const studyTime = Math.round((Date.now() - studyStartTime) / 1000);

    // 結果画面にリダイレクト
    const resultsParam = encodeURIComponent(JSON.stringify(results));
    router.push(`/card-sets/${params.id}/result?results=${resultsParam}&time=${studyTime}`);
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const markAnswer = (result: 'correct' | 'incorrect' | 'skip') => {
    setStudyResults(prev => ({
      ...prev,
      [cards[currentCardIndex].id]: result
    }));
    nextCard();
  };

  const getProgressPercentage = () => {
    const answered = Object.keys(studyResults).length;
    return Math.round((answered / cards.length) * 100);
  };

  if (isStudyMode) {
    const currentCard = cards[currentCardIndex];
    const progress = getProgressPercentage();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <Link 
              href="/card-sets"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              単語帳一覧に戻る
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{cardSet.title}</h1>
                <p className="text-gray-600 mt-2">学習中...</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">進捗</div>
                <div className="text-2xl font-bold text-blue-600">{progress}%</div>
              </div>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>問題 {currentCardIndex + 1} / {cards.length}</span>
              <span>{progress}% 完了</span>
            </div>
          </div>

          {/* カード */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">問題 {currentCardIndex + 1}</h2>
              <p className="text-lg text-gray-700 leading-relaxed">{currentCard.question}</p>
            </div>

            {showAnswer ? (
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">答え</h3>
                <p className="text-lg text-gray-700 mb-4">{currentCard.answer}</p>
                {currentCard.source && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">アドバイス・ソース</h4>
                    <p className="text-blue-800">{currentCard.source}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center mb-8">
                <button
                  onClick={() => setShowAnswer(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg"
                >
                  答えを見る
                </button>
              </div>
            )}

            {/* ナビゲーション */}
            <div className="flex justify-between items-center">
              <button
                onClick={previousCard}
                disabled={currentCardIndex === 0}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                前の問題
              </button>

              {showAnswer && (
                <div className="flex gap-3">
                  <button
                    onClick={() => markAnswer('incorrect')}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    間違えた
                  </button>
                  <button
                    onClick={() => markAnswer('skip')}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    スキップ
                  </button>
                  <button
                    onClick={() => markAnswer('correct')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    正解
                  </button>
                </div>
              )}

              <button
                onClick={nextCard}
                disabled={currentCardIndex === cards.length - 1}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                次の問題
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link 
            href="/card-sets"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            単語帳一覧に戻る
            </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{cardSet.title}</h1>
              <p className="text-gray-600 mt-2">{cardSet.description}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/card-sets/${params.id}/add-cards`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg"
              >
                カードを追加
              </Link>
              <Link
                href={`/card-sets/${params.id}/study`}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg"
              >
                学習開始
              </Link>
            </div>
          </div>
        </div>

        {/* カードセット情報 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">作成者:</span>
                  <span className="font-medium">{cardSet.owner.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">作成日:</span>
                  <span className="font-medium">{formatDate(cardSet.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">カード数:</span>
                  <span className="font-medium">{cardSet._count.cards}枚</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">公開設定:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    cardSet.visibility === 'public' ? 'bg-green-100 text-green-800' :
                    cardSet.visibility === 'unlisted' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cardSet.visibility === 'public' ? '公開' : 
                     cardSet.visibility === 'unlisted' ? '限定公開' : '非公開'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">統計</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">いいね:</span>
                  <span className="font-medium">{likeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ブックマーク:</span>
                  <span className="font-medium">{cardSet._count.bookmarks}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* いいねボタン */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <button
                onClick={handleLikeClick}
                disabled={!cardSet}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                  isLiked
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${!cardSet ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <svg 
                  className={`w-6 h-6 ${isLiked ? 'fill-current text-red-100' : 'stroke-current fill-none'}`}
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
                <span className="font-semibold text-lg">
                  {isLiked ? 'いいね済み ❤️' : 'いいね 🤍'}
                </span>
                <span className={`text-sm font-bold ${isLiked ? 'text-red-100' : 'text-gray-600'}`}>
                  ({likeCount})
                </span>
                {/* デバッグ情報 */}
                <span className="text-xs text-gray-400 ml-2">
                  {isLiked ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* タグ */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">タグ</h3>
          <div className="flex flex-wrap gap-2">
            {cardSet.tags.split(',').map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* カード一覧 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">カード一覧 ({cards.length}枚)</h3>
            <Link
              href={`/card-sets/${params.id}/add-cards`}
              className="text-green-600 hover:text-green-700 text-sm font-medium hover:underline"
            >
              + カードを追加
            </Link>
          </div>
          {cards.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>まだカードがありません</p>
              <p className="text-sm">カードを追加して学習を始めましょう</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card, index) => (
                <div key={card.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-500">カード {index + 1}</span>
                  </div>
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 mb-2">問題</h4>
                    <p className="text-gray-700">{card.question}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">答え</h4>
                    <p className="text-gray-700">{card.answer}</p>
                  </div>
                  {card.source && (
                    <div className="mt-3">
                      <h4 className="font-medium text-gray-900 mb-2">アドバイス・ソース</h4>
                      <p className="text-gray-600 text-sm">{card.source}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
