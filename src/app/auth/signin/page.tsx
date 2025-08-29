'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

const signInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  // セッションが存在する場合の自動リダイレクト
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // 認証済みの場合はダッシュボードにリダイレクト
    if (status === 'authenticated' && session) {
      console.log('✅ User is authenticated, redirecting to dashboard...');
      router.push('/dashboard');
      router.refresh(); // セッション状態を更新
    }
  }, [session, status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 Attempting login for:', data.email);
      
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/dashboard'
      });

      console.log('📊 SignIn result:', result);

      if (result?.error) {
        console.error('❌ Login failed:', result.error);
        setError(`ログインエラー: ${result.error}`);
      } else if (result?.ok) {
        console.log('✅ Login successful, redirecting to dashboard...');
        // ログイン成功後、確実にダッシュボードにリダイレクト
        router.push('/dashboard');
        router.refresh(); // セッション状態を更新
      } else {
        console.log('⚠️ Login result unclear');
        setError('ログインの結果が不明です。再度お試しください。');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(`ログインエラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ローディング中または既に認証済みの場合はローディング表示
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">ログイン状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 既に認証済みの場合は何も表示しない（リダイレクト中）
  if (status === 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ホームに戻る
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900">ログイン</h2>
          <p className="mt-2 text-sm text-gray-600">
            アカウントにログインして学習を続けましょう
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* パスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="パスワードを入力"
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* デバッグ情報（開発環境のみ） */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">
                  <strong>デバッグ情報:</strong>
                </p>
                <p className="text-xs text-gray-500">
                  セッション状態: {status}
                </p>
              </div>
            )}

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ログイン中...
                </div>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          {/* 新規登録リンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                新規登録
              </Link>
            </p>
          </div>

          {/* デモ用情報 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              <strong>デモ用アカウント:</strong><br />
              メール: demo@med.ai<br />
              パスワード: demo1234
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  setError('');
                  setIsLoading(true);
                  const demoEmail = 'demo@med.ai';
                  const demoPassword = 'demo1234';
                  console.log('🧪 Testing demo login:', demoEmail);
                  
                  const result = await signIn('credentials', {
                    email: demoEmail,
                    password: demoPassword,
                    redirect: false,
                    callbackUrl: '/dashboard'
                  });
                  
                  console.log('🧪 Demo login result:', result);
                  
                  if (result?.error) {
                    console.error('❌ Demo login failed:', result.error);
                    setError(`デモログインエラー: ${result.error}`);
                  } else if (result?.ok) {
                    console.log('✅ Demo login successful, redirecting to dashboard...');
                    router.push('/dashboard');
                    router.refresh(); // セッション状態を更新
                  } else {
                    console.log('⚠️ Demo login result unclear');
                    setError('デモログインの結果が不明です。再度お試しください。');
                  }
                } catch (error) {
                  console.error('❌ Demo login error:', error);
                  setError(`デモログインエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm font-medium"
            >
              {isLoading ? 'ログイン中...' : 'デモアカウントでログイン'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
