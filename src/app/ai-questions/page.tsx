'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navigation from '../../components/Navigation';

const questionFormSchema = z.object({
  topic: z.string().min(1, 'トピックを入力してください'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(10),
});

type QuestionForm = z.infer<typeof questionFormSchema>;

interface GeneratedQuestion {
  question: string;
  answer: string;
  explanation: string;
}

export default function AIQuestionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      topic: '',
      difficulty: 'medium',
      count: 3,
    },
  });

  const onSubmit = async (data: QuestionForm) => {
    setIsLoading(true);
    setError('');
    setQuestions([]);

    // デバッグ用：送信データをコンソールに出力
    console.log('🚀 Sending data to API:', data);
    console.log('📊 Data type check:', {
      topic: typeof data.topic,
      difficulty: typeof data.difficulty,
      count: typeof data.count,
      difficultyValue: data.difficulty
    });

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setQuestions(result.questions);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        setError(errorData.error || '問題の生成に失敗しました');
      }
    } catch (err) {
      console.error('❌ Fetch Error:', err);
      setError('問題の生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI問題作成
          </h1>
          <p className="text-lg text-gray-600">
            AIが最適な医学問題を自動生成します
          </p>
        </div>

        {/* 問題生成フォーム */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">問題設定</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                トピック
              </label>
              <input
                {...register('topic')}
                type="text"
                id="topic"
                placeholder="例: 循環器、神経学、薬理学..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.topic && (
                <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                  難易度
                </label>
                <select
                  {...register('difficulty')}
                  id="difficulty"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">初級</option>
                  <option value="medium">中級</option>
                  <option value="hard">上級</option>
                </select>
              </div>

              <div>
                <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                  問題数
                </label>
                <input
                  {...register('count', { valueAsNumber: true })}
                  type="number"
                  id="count"
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </div>
              ) : (
                '問題を生成'
              )}
            </button>
          </form>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 生成された問題 */}
        {questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">生成された問題</h2>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      問題 {index + 1}
                    </h3>
                    <p className="text-gray-700">{question.question}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">答え</h4>
                    <p className="text-gray-700">{question.answer}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">解説</h4>
                    <p className="text-gray-700">{question.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
