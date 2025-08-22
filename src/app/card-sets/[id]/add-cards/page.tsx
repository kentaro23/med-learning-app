'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// import Navigation from '@/components/Navigation';

interface Card {
  id: string;
  question: string;
  answer: string;
  source?: string;
  createdAt: string;
}

interface CardSet {
  id: string;
  title: string;
  description?: string;
  visibility: string;
  tags?: string;
  owner: {
    name: string;
  };
  _count: {
    cards: number;
  };
}

export default function AddCardsPage() {
  const params = useParams();
  const router = useRouter();
  const cardSetId = params.id as string;
  
  const [cardSet, setCardSet] = useState<CardSet | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const [practiceResults, setPracticeResults] = useState<{ [key: string]: 'correct' | 'incorrect' | 'skip' }>({});
  const [isOwner, setIsOwner] = useState(false);
  
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    source: ''
  });

  // 単語帳とカードの情報を取得
  useEffect(() => {
    const fetchCardSetData = async () => {
      try {
        // 単語帳の基本情報を取得
        const cardSetResponse = await fetch(`/api/card-sets/${cardSetId}`);
        console.log('CardSet Response Status:', cardSetResponse.status);
        if (cardSetResponse.ok) {
          const cardSetData = await cardSetResponse.json();
          console.log('CardSet Data:', cardSetData);
          setCardSet(cardSetData.cardSet);
          
          // 作成者チェック（実際の実装ではセッションからユーザーIDを取得）
          // 一時的にデモユーザーとして扱う
          setIsOwner(true);
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

    if (cardSetId) {
      fetchCardSetData();
    }
  }, [cardSetId]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      alert('問題と答えは必須です');
      return;
    }

    setIsAddingCard(true);
    
    try {
      const response = await fetch(`/api/card-sets/${cardSetId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newCard.question.trim(),
          answer: newCard.answer.trim(),
          source: newCard.source.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Card added:', result);
        
        // 新規カードをリストに追加
        setCards(prev => [...prev, result.card]);
        
        // フォームをリセット
        setNewCard({
          question: '',
          answer: '',
          source: ''
        });
        
        alert('カードが正常に追加されました！');
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        alert(`カードの追加に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding card:', error);
      alert('カードの追加に失敗しました');
    } finally {
      setIsAddingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('このカードを削除しますか？')) return;

    try {
      const response = await fetch(`/api/card-sets/${cardSetId}/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // カードをリストから削除
        setCards(prev => prev.filter(card => card.id !== cardId));
        alert('カードが削除されました');
      } else {
        const errorData = await response.json();
        alert(`カードの削除に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('カードの削除に失敗しました');
    }
  };

  const startPractice = () => {
    setShowPracticeModal(true);
    setCurrentPracticeIndex(0);
    setShowPracticeAnswer(false);
    setPracticeResults({});
  };

  const nextPracticeCard = () => {
    if (currentPracticeIndex < cards.length - 1) {
      setCurrentPracticeIndex(currentPracticeIndex + 1);
      setShowPracticeAnswer(false);
    } else {
      // 演習完了
      setShowPracticeModal(false);
      alert('問題演習が完了しました！');
    }
  };

  const recordPracticeResult = (result: 'correct' | 'incorrect' | 'skip') => {
    const currentCard = cards[currentPracticeIndex];
    setPracticeResults(prev => ({
      ...prev,
      [currentCard.id]: result
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600">単語帳が見つかりません</p>
            <Link href="/card-sets" className="text-blue-600 hover:underline mt-2 inline-block">
              単語帳一覧に戻る
            </Link>
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
          <Link 
            href={`/card-sets/${cardSetId}`}
            className="inline-flex items-center text-green-600 hover:text-green-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            単語帳詳細に戻る
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{cardSet.title}</h1>
              <p className="text-gray-600 mt-2">{cardSet.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>作成者: {cardSet.owner.name}</span>
                <span>カード数: {cards.length}枚</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  cardSet.visibility === 'public' ? 'bg-green-100 text-green-800' :
                  cardSet.visibility === 'unlisted' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cardSet.visibility === 'public' ? '公開' :
                   cardSet.visibility === 'unlisted' ? '限定公開' : '非公開'}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/card-sets/${cardSetId}`}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                学習開始
              </Link>
              <button
                onClick={startPractice}
                disabled={cards.length === 0}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  cards.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                問題演習
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 新規カード追加フォーム - 作成者のみ表示 */}
          {isOwner ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">新規カード追加</h2>
            
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  問題 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="question"
                  value={newCard.question}
                  onChange={(e) => setNewCard(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="問題文を入力してください"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  答え <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="answer"
                  value={newCard.answer}
                  onChange={(e) => setNewCard(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="答えを入力してください"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                  アドバイス・ソース
                </label>
                <input
                  type="text"
                  id="source"
                  value={newCard.source}
                  onChange={(e) => setNewCard(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="参考資料やアドバイス（任意）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingCard}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingCard ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    追加中...
                  </span>
                ) : (
                  'カードを追加'
                )}
              </button>
            </form>
          </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">カード追加について</h2>
              <div className="text-center text-gray-500 py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-lg mb-2">カードの追加は作成者のみ可能です</p>
                <p className="text-sm">この単語帳の作成者に連絡してカード追加を依頼してください</p>
              </div>
            </div>
          )}

          {/* 既存カード一覧 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">既存カード一覧 ({cards.length}枚)</h2>
            
            {cards.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>まだカードがありません</p>
                <p className="text-sm">左のフォームからカードを追加してください</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cards.map((card, index) => (
                  <div key={card.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-500">カード {index + 1}</span>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">問題:</p>
                      <p className="text-gray-900">{card.question}</p>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">答え:</p>
                      <p className="text-gray-900">{card.answer}</p>
                    </div>
                    {card.source && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">アドバイス・ソース:</p>
                        <p className="text-gray-700 text-sm">{card.source}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ホームへの戻り方選択 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">作業完了</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/card-sets')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              保存してホームに戻る
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存してダッシュボードに戻る
            </button>
            <button
              onClick={() => router.push('/card-sets')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              保存しないでホームに戻る
            </button>
          </div>
        </div>
      </div>

      {/* 問題演習モーダル */}
      {showPracticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">問題演習</h2>
              <button
                onClick={() => setShowPracticeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cards.length > 0 && (
              <div className="space-y-6">
                {/* 進捗表示 */}
                <div className="text-center">
                  <p className="text-gray-600">
                    問題 {currentPracticeIndex + 1} / {cards.length}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentPracticeIndex + 1) / cards.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* 問題表示 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">問題</h3>
                  <p className="text-gray-800 text-lg">{cards[currentPracticeIndex].question}</p>
                </div>

                {/* 答え表示/非表示 */}
                {!showPracticeAnswer ? (
                  <div className="text-center">
                    <button
                      onClick={() => setShowPracticeAnswer(true)}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      答えを見る
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">答え</h3>
                      <p className="text-gray-800 text-lg">{cards[currentPracticeIndex].answer}</p>
                      {cards[currentPracticeIndex].source && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">アドバイス・ソース:</p>
                          <p className="text-gray-700">{cards[currentPracticeIndex].source}</p>
                        </div>
                      )}
                    </div>

                    {/* 結果記録ボタン */}
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => {
                          recordPracticeResult('correct');
                          nextPracticeCard();
                        }}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        正解
                      </button>
                      <button
                        onClick={() => {
                          recordPracticeResult('incorrect');
                          nextPracticeCard();
                        }}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        不正解
                      </button>
                      <button
                        onClick={() => {
                          recordPracticeResult('skip');
                          nextPracticeCard();
                        }}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        スキップ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
