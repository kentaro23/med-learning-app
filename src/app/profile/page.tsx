import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  // サーバーサイドでユーザー情報と統計を取得
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      name: true,
      email: true,
      university: true,
      grade: true,
      major: true,
      subscriptionType: true,
      subscriptionExpiresAt: true,
      _count: {
        select: {
          cardSets: true,
          docs: true,
        }
      }
    }
  });

  if (!user) redirect('/auth/signin');

  // 統計情報を計算
  const stats: Stats = {
    totalCards: 0, // TODO: 実際のカード数を計算
    totalCardSets: user._count.cardSets,
    totalDocs: user._count.docs,
    followers: 0, // TODO: フォロワー数を実装
    following: 0  // TODO: フォロー数を実装
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
        </div>

        {/* プロフィール情報 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">名前:</span>
                <span className="font-medium">{user.name || '未設定'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">メール:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">大学:</span>
                <span className="font-medium">{user.university || '未設定'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">学年:</span>
                <span className="font-medium">{user.grade || '未設定'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">専攻:</span>
                <span className="font-medium">{user.major || '未設定'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">プラン:</span>
                <span className="font-medium">{user.subscriptionType === 'premium' ? 'プレミアム' : '無料'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">統計</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalCardSets}</div>
              <div className="text-gray-600">単語帳</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalCards}</div>
              <div className="text-gray-600">カード</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalDocs}</div>
              <div className="text-gray-600">PDF資料</div>
            </div>
          </div>
        </div>

        {/* アクション */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">アクション</h2>
          <div className="flex gap-4">
            <Link
              href="/profile/followers"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              フォロワー ({stats.followers})
            </Link>
            <Link
              href="/profile/following"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              フォロー中 ({stats.following})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
