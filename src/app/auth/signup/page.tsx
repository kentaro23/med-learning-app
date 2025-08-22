'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const signUpSchema = z.object({
  name: z.string().min(2, '名前は2文字以上で入力してください').max(50, '名前は50文字以下で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください').max(100, 'パスワードは100文字以下で入力してください'),
  confirmPassword: z.string(),
  university: z.string().min(1, '大学名を入力してください'),
  grade: z.string().min(1, '学年を選択してください'),
  major: z.string().min(1, '専攻を入力してください'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          university: data.university,
          grade: data.grade,
          major: data.major,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('アカウントが作成されました！自動的にログインします...');
        
        // 新規登録成功後、自動的にログイン
        try {
          const loginResponse = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              password: data.password,
            }),
          });

          if (loginResponse.ok) {
            // ログイン成功、ダッシュボードにリダイレクト
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          } else {
            // ログイン失敗、サインインページにリダイレクト
            setTimeout(() => {
              router.push('/auth/signin');
            }, 2000);
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          // ログイン失敗、サインインページにリダイレクト
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'アカウントの作成に失敗しました');
      }
    } catch (err) {
      setError('アカウントの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-800 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ホームに戻る
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900">新規登録</h2>
          <p className="mt-2 text-sm text-gray-600">
            新しいアカウントを作成して学習を始めましょう
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ユーザー名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名 *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="あなたの名前"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス *
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード *
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="6文字以上で入力"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認 *
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="パスワードを再入力"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* 大学名 */}
            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2">
                大学名 *
              </label>
              <input
                id="university"
                type="text"
                {...register('university')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="例：東京医科大学"
              />
              {errors.university && (
                <p className="text-red-600 text-sm mt-1">{errors.university.message}</p>
              )}
            </div>

            {/* 学年 */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                学年 *
              </label>
              <select
                id="grade"
                {...register('grade')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">学年を選択してください</option>
                <option value="1年生">1年生</option>
                <option value="2年生">2年生</option>
                <option value="3年生">3年生</option>
                <option value="4年生">4年生</option>
                <option value="5年生">5年生</option>
                <option value="6年生">6年生</option>
                <option value="大学院生">大学院生</option>
                <option value="その他">その他</option>
              </select>
              {errors.grade && (
                <p className="text-red-600 text-sm mt-1">{errors.grade.message}</p>
              )}
            </div>

            {/* 専攻 */}
            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                専攻 *
              </label>
              <input
                id="major"
                type="text"
                {...register('major')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="例：医学部"
              />
              {errors.major && (
                <p className="text-red-600 text-sm mt-1">{errors.major.message}</p>
              )}
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* 成功メッセージ */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登録中...
                </div>
              ) : (
                'アカウントを作成'
              )}
            </button>
          </form>

          {/* ログインリンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちの方は{' '}
              <Link href="/auth/signin" className="text-green-600 hover:text-green-800 font-medium">
                ログイン
              </Link>
            </p>
          </div>

          {/* 利用規約 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              登録することで、{' '}
              <Link href="/terms" className="text-green-600 hover:text-green-800">
                利用規約
              </Link>
              と{' '}
              <Link href="/privacy" className="text-green-600 hover:text-green-800">
                プライバシーポリシー
              </Link>
              に同意したことになります
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
