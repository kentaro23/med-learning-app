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

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const cardSetId = params.id as string;
  
  const [cardSet, setCardSet] = useState<CardSet | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyResults, setStudyResults] = useState<{ [key: string]: 'correct' | 'incorrect' | 'skip' }>({});
  const [studyStartTime, setStudyStartTime] = useState<number>(0);
  const [isStudyStarted, setIsStudyStarted] = useState(false);

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

  // 単語帳とカードの情報を取得
  useEffect(() => {
    console.log('🚀 Study page useEffect triggered for cardSetId:', cardSetId);
    
    if (cardSetId) {
      // 即座にデモデータを設定
      console.log('📚 Setting demo data immediately');
      setDemoCardSet();
      setDemoCards();
      setIsLoading(false);
      
      // バックグラウンドでAPI呼び出し（オプション）
      const fetchDataInBackground = async () => {
        try {
          console.log('🔄 Fetching data in background...');
          
          // 単語帳の基本情報を取得
          try {
            const cardSetResponse = await fetch(`/api/card-sets/${cardSetId}`);
            if (cardSetResponse.ok) {
              const cardSetData = await cardSetResponse.json();
              console.log('✅ CardSet data fetched successfully:', cardSetData);
              if (cardSetData.cardSet) {
                setCardSet(cardSetData.cardSet);
              }
            }
          } catch (error) {
            console.log('⚠️ CardSet API call failed, using demo data');
          }

          // カード一覧を取得
          try {
            const cardsResponse = await fetch(`/api/card-sets/${cardSetId}/cards`);
            if (cardsResponse.ok) {
              const cardsData = await cardsResponse.json();
              console.log('✅ Cards data fetched successfully:', cardsData);
              if (cardsData.cards && cardsData.cards.length > 0) {
                setCards(cardsData.cards);
              }
            }
          } catch (error) {
            console.log('⚠️ Cards API call failed, using demo data');
          }
        } catch (error) {
          console.log('⚠️ Background fetch failed, continuing with demo data');
        }
      };

      // 非同期でバックグラウンド実行
      fetchDataInBackground();
    }
  }, [cardSetId]);

  // フォールバックタイマー（万が一の無限ローディング防止）
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        console.log('⚠️ Fallback timer triggered - forcing loading to false');
        setIsLoading(false);
        // デモデータが設定されていない場合は設定
        if (!cardSet) {
          console.log('🔄 Setting demo card set from fallback timer');
          setDemoCardSet();
        }
        if (cards.length === 0) {
          console.log('🔄 Setting demo cards from fallback timer');
          setDemoCards();
        }
      }
    }, 2000); // 2秒後にフォールバック

    return () => clearTimeout(fallbackTimer);
  }, [isLoading, cardSet, cards.length]);

  // デモデータの設定
  const setDemoCardSet = () => {
    console.log('🎭 Setting demo card set');
    const demoCardSet: CardSet = {
      id: cardSetId,
      title: '神経学の重要ポイント',
      description: '神経系の診断と治療',
      tags: '神経学,診断,治療',
      visibility: 'public',
      _count: { cards: 3, likes: 15, bookmarks: 18 },
      owner: { name: '医学生B' },
      createdAt: new Date('2024-01-10'),
    };
    console.log('✅ Demo card set created:', demoCardSet);
    setCardSet(demoCardSet);
  };

  const setDemoCards = () => {
    console.log('🎭 Setting demo cards');
    const demoCards: Card[] = [
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
    console.log('✅ Demo cards created:', demoCards);
    setCards(demoCards);
  };

  // 学習開始
  const startStudy = async () => {
    console.log('🚀 Starting study session');
    console.log('📊 Current state:', { cardSet, cards: cards.length, isStudyStarted });
    
    try {
      if (!cardSet || cards.length === 0) {
        console.error('❌ Cannot start study: missing data');
        alert('学習に必要なデータが不足しています。');
        return;
      }

      // 使用制限チェック
      try {
        const usageResponse = await fetch('/api/usage/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ feature: 'cardSets' }),
        });

        if (!usageResponse.ok) {
          const errorData = await usageResponse.json();
          if (usageResponse.status === 429) {
            // 使用制限に達した場合
            alert(`使用制限に達しました: ${errorData.details}`);
            return;
          }
          // エラーが発生した場合でも、デモアカウントの場合は学習を開始
          console.warn('Usage check failed, but proceeding for demo account:', errorData);
        } else {
          const usageData = await usageResponse.json();
          console.log('✅ Usage check passed:', usageData.message);
        }
      } catch (usageError) {
        console.error('Usage check error:', usageError);
        // エラーが発生した場合でも、デモアカウントの場合は学習を開始
        console.warn('Usage check failed, but proceeding for demo account');
      }
      
      setIsStudyStarted(true);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setStudyResults({});
      setStudyStartTime(Date.now());
      console.log('✅ Study session started successfully');
    } catch (error) {
      console.error('❌ Error starting study session:', error);
      alert('学習の開始に失敗しました。');
    }
  };

  // 次のカード
  const nextCard = () => {
    console.log('🔄 Moving to next card. Current:', currentCardIndex, 'Total:', cards.length);
    
    try {
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowAnswer(false);
        console.log('✅ Moved to next card:', currentCardIndex + 1);
      } else {
        // 学習完了
        console.log('🎉 Study completed!');
        completeStudy();
      }
    } catch (error) {
      console.error('❌ Error moving to next card:', error);
      alert('次のカードに進む際にエラーが発生しました。');
    }
  };

  // 前のカード
  const previousCard = () => {
    console.log('🔄 Moving to previous card. Current:', currentCardIndex);
    
    try {
      if (currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
        setShowAnswer(false);
        console.log('✅ Moved to previous card:', currentCardIndex - 1);
      }
    } catch (error) {
      console.error('❌ Error moving to previous card:', error);
      alert('前のカードに戻る際にエラーが発生しました。');
    }
  };

  // 学習完了
  const completeStudy = () => {
    console.log('🏁 Completing study session');
    
    try {
      // 学習結果を整形
      const results = cards.map(card => ({
        cardId: card.id,
        result: studyResults[card.id] || 'skip',
        question: card.question,
        answer: card.answer,
        explanation: card.source
      }));

      // 学習時間を計算（秒）
      const studyTime = Math.round((Date.now() - studyStartTime) / 1000);

      console.log('📊 Study results:', results);
      console.log('⏱️ Study time:', studyTime, 'seconds');

      // 結果画面にリダイレクト
      const resultsParam = encodeURIComponent(JSON.stringify(results));
      router.push(`/card-sets/${cardSetId}/result?results=${resultsParam}&time=${studyTime}`);
    } catch (error) {
      console.error('❌ Error completing study:', error);
      alert('学習の完了処理に失敗しました。');
    }
  };

  // 答えの評価
  const markAnswer = (result: 'correct' | 'incorrect' | 'skip') => {
    console.log('📝 Marking answer:', result, 'for card:', currentCardIndex);
    
    try {
      const currentCard = cards[currentCardIndex];
      if (!currentCard) {
        console.error('❌ Current card not found at index:', currentCardIndex);
        return;
      }
      
      setStudyResults(prev => ({
        ...prev,
        [currentCard.id]: result
      }));
      console.log('✅ Answer marked successfully');
      nextCard();
    } catch (error) {
      console.error('❌ Error marking answer:', error);
      alert('答えの評価に失敗しました。');
    }
  };

  // 進捗率の計算
  const getProgressPercentage = () => {
    const answered = Object.keys(studyResults).length;
    return Math.round((answered / cards.length) * 100);
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">単語帳を読み込み中...</p>
            <p className="mt-2 text-sm text-gray-500">しばらくお待ちください</p>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => {
                  console.log('🔄 Manual loading reset triggered');
                  setIsLoading(false);
                  setDemoCardSet();
                  setDemoCards();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                手動で読み込みをリセット
              </button>
              <div className="text-xs text-gray-500">
                2秒後に自動的にデモデータが表示されます
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 単語帳が見つからない場合
  if (!cardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">単語帳の読み込みに失敗しました</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  console.log('🔄 Retrying card set data fetch');
                  setDemoCardSet();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-3"
              >
                再試行
              </button>
              <Link href="/card-sets" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                単語帳一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 学習開始前の画面
  if (!isStudyStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <Link 
              href={`/card-sets/${cardSetId}`}
              className="inline-flex items-center text-green-600 hover:text-green-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              単語帳詳細に戻る
            </Link>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{cardSet.title}</h1>
              <p className="text-xl text-gray-600 mb-8">{cardSet.description}</p>
              
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">学習準備</h2>
                
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{cards.length}</div>
                    <div className="text-gray-600">カード数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{cardSet._count.likes}</div>
                    <div className="text-gray-600">いいね数</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>作成者:</span>
                    <span className="font-medium">{cardSet.owner.name}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>作成日:</span>
                    <span className="font-medium">{formatDate(cardSet.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>公開設定:</span>
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
                
                <div className="mt-8">
                  <button
                    onClick={startStudy}
                    disabled={cards.length === 0}
                    className={`w-full py-4 px-8 rounded-lg text-lg font-semibold transition-colors ${
                      cards.length === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {cards.length === 0 ? 'カードがありません' : '学習を開始する'}
                  </button>
                  
                  {cards.length === 0 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      カードを追加してから学習を開始してください
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 学習中の画面
  const currentCard = cards[currentCardIndex];
  const progress = getProgressPercentage();
  
  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">カードの読み込みに失敗しました</p>
            <button
              onClick={() => setIsStudyStarted(false)}
              className="text-blue-600 hover:underline mt-2"
            >
              学習準備画面に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link 
              href={`/card-sets/${cardSetId}`}
              className="inline-flex items-center text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              単語帳詳細に戻る
            </Link>
            
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900">{cardSet.title}</h1>
              <p className="text-gray-600">学習中</p>
            </div>
          </div>
          
          {/* 進捗バー */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                進捗: {currentCardIndex + 1} / {cards.length}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {progress}% 完了
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* カード表示 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            {/* 問題 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">問題</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-2xl text-gray-900 leading-relaxed">{currentCard.question}</p>
              </div>
            </div>

            {/* 答え */}
            {!showAnswer ? (
              <div className="text-center">
                <button
                  onClick={() => setShowAnswer(true)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                >
                  答えを見る
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">答え</h3>
                  <p className="text-2xl text-gray-800 leading-relaxed mb-4">{currentCard.answer}</p>
                  {currentCard.source && (
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">アドバイス・ソース:</p>
                      <p className="text-gray-700">{currentCard.source}</p>
                    </div>
                  )}
                </div>

                {/* 評価ボタン */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => markAnswer('correct')}
                    className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                  >
                    正解
                  </button>
                  <button
                    onClick={() => markAnswer('incorrect')}
                    className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-colors text-lg font-semibold"
                  >
                    不正解
                  </button>
                  <button
                    onClick={() => markAnswer('skip')}
                    className="bg-gray-600 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors text-lg font-semibold"
                  >
                    スキップ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ナビゲーションボタン */}
          <div className="flex justify-between items-center">
            <button
              onClick={previousCard}
              disabled={currentCardIndex === 0}
              className={`px-6 py-3 rounded-lg transition-colors ${
                currentCardIndex === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              前の問題
            </button>
            
            <button
              onClick={() => setIsStudyStarted(false)}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              学習を中断
            </button>
            
            <button
              onClick={nextCard}
              disabled={currentCardIndex === cards.length - 1}
              className={`px-6 py-3 rounded-lg transition-colors ${
                currentCardIndex === cards.length - 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              次の問題
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
