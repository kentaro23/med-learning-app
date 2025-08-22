'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface StudyResult {
  cardId: string;
  result: 'correct' | 'incorrect' | 'skip';
  question: string;
  answer: string;
  explanation?: string;
}

interface StudySummary {
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  skipCount: number;
  accuracy: number;
  studyTime: number; // 秒
}

export default function StudyResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [studyResults, setStudyResults] = useState<StudyResult[]>([]);
  const [summary, setSummary] = useState<StudySummary>({
    totalCards: 0,
    correctCount: 0,
    incorrectCount: 0,
    skipCount: 0,
    accuracy: 0,
    studyTime: 0
  });

  useEffect(() => {
    // URLパラメータから学習結果を取得（実際の実装ではAPIから取得）
    const resultsParam = searchParams.get('results');
    const timeParam = searchParams.get('time');
    
    if (resultsParam) {
      try {
        const results = JSON.parse(decodeURIComponent(resultsParam));
        setStudyResults(results);
        
        // 統計を計算
        const totalCards = results.length;
        const correctCount = results.filter((r: StudyResult) => r.result === 'correct').length;
        const incorrectCount = results.filter((r: StudyResult) => r.result === 'incorrect').length;
        const skipCount = results.filter((r: StudyResult) => r.result === 'skip').length;
        const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;
        const studyTime = timeParam ? parseInt(timeParam) : 0;
        
        setSummary({
          totalCards,
          correctCount,
          incorrectCount,
          skipCount,
          accuracy,
          studyTime
        });
      } catch (error) {
        console.error('Failed to parse study results:', error);
        // デモ用のサンプルデータを表示
        setDemoData();
      }
    } else {
      // デモ用のサンプルデータを表示
      setDemoData();
    }
  }, [searchParams]);

  const setDemoData = () => {
    const demoResults: StudyResult[] = [
      {
        cardId: '1',
        result: 'correct',
        question: '脳梗塞の初期症状として最も重要なのは？',
        answer: '片麻痺',
        explanation: '脳梗塞では片側の運動麻痺が最も特徴的な初期症状です。'
      },
      {
        cardId: '2',
        result: 'incorrect',
        question: 'パーキンソン病の三大症状は？',
        answer: '振戦、筋固縮、無動',
        explanation: 'パーキンソン病の主要症状として知られています。'
      },
      {
        cardId: '3',
        result: 'correct',
        question: '多発性硬化症の特徴的な所見は？',
        answer: '時間的多発性と空間的多発性',
        explanation: '時間的・空間的に多発する脱髄病変が特徴です。'
      }
    ];
    
    setStudyResults(demoResults);
    
    const totalCards = demoResults.length;
    const correctCount = demoResults.filter(r => r.result === 'correct').length;
    const incorrectCount = demoResults.filter(r => r.result === 'incorrect').length;
    const skipCount = demoResults.filter(r => r.result === 'skip').length;
    const accuracy = Math.round((correctCount / totalCards) * 100);
    
    setSummary({
      totalCards,
      correctCount,
      incorrectCount,
      skipCount,
      accuracy,
      studyTime: 180 // 3分
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'correct': return 'text-green-600 bg-green-100';
      case 'incorrect': return 'text-red-600 bg-red-100';
      case 'skip': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'correct': return '正解';
      case 'incorrect': return '間違い';
      case 'skip': return 'スキップ';
      default: return '不明';
    }
  };

  const retryStudy = () => {
    router.push(`/card-sets/${params.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <Link 
            href="/card-sets"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            単語帳一覧に戻る
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">学習完了！</h1>
          <p className="text-xl text-gray-600">お疲れさまでした。今回の学習結果をご確認ください。</p>
        </div>

        {/* 結果サマリー */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">学習結果サマリー</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{summary.totalCards}</div>
              <div className="text-gray-600">総問題数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{summary.correctCount}</div>
              <div className="text-gray-600">正解数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{summary.incorrectCount}</div>
              <div className="text-gray-600">間違い数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{summary.skipCount}</div>
              <div className="text-gray-600">スキップ数</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">{summary.accuracy}%</div>
              <div className="text-gray-600">正答率</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{formatTime(summary.studyTime)}</div>
              <div className="text-gray-600">学習時間</div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={retryStudy}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
            >
              もう一度学習する
            </button>
            <Link
              href="/card-sets"
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors text-lg font-medium text-center"
            >
              他の単語帳を見る
            </Link>
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium text-center"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* 詳細結果 */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">問題別結果</h2>
          
          <div className="space-y-6">
            {studyResults.map((result, index) => (
              <div key={result.cardId} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-lg font-medium text-gray-900">問題 {index + 1}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getResultColor(result.result)}`}>
                    {getResultLabel(result.result)}
                  </span>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">問題</h4>
                  <p className="text-gray-700">{result.question}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">答え</h4>
                  <p className="text-gray-700">{result.answer}</p>
                </div>
                
                {result.explanation && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">解説</h4>
                    <p className="text-gray-600">{result.explanation}</p>
                  </div>
                )}
                
                {result.result === 'incorrect' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="font-medium text-red-900 mb-2">💡 復習ポイント</h5>
                    <p className="text-red-800 text-sm">
                      この問題は間違えました。解説をよく読んで、次回は正解できるようにしましょう。
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 学習のコツ */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">学習のコツ</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 効率的な学習法</h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• 間違えた問題は重点的に復習</li>
                <li>• 定期的に学習セッションを実施</li>
                <li>• 理解できた問題は間隔を空けて復習</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 記憶の定着</h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• 学習後24時間以内に復習</li>
                <li>• 1週間後にもう一度確認</li>
                <li>• 実践的な問題で応用力を養う</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
