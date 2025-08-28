import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma, safePrismaOperation, checkDatabaseConnection } from '@/lib/prisma';
import Link from 'next/link';
import Navigation from '../../components/Navigation';

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

interface UsageLimits {
  aiQuestionsGenerated: number;
  cardSetsStudied: number;
  pdfsProcessed: number;
  aiQuestionsLimit: number;
  cardSetsLimit: number;
  pdfsLimit: number;
}

export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/auth/signin');

    // データベース接続をチェック
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      console.error('Database connection failed');
      redirect('/auth/signin');
    }

    // サーバーサイドでユーザー情報と統計を取得
    const user = await safePrismaOperation(() =>
      prisma.user.findUnique({
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
      })
    );

    if (!user) redirect('/auth/signin');

  // ユーザーのカードセットを取得
  const myCardSets = await prisma.cardSet.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
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

  // 使用制限を取得
  const dailyUsage = await prisma.dailyUsage.findUnique({
    where: { userId: user.id }
  });

  const usageLimits: UsageLimits = {
    aiQuestionsGenerated: dailyUsage?.aiQuestionsGenerated || 0,
    cardSetsStudied: dailyUsage?.cardSetsStudied || 0,
    pdfsProcessed: dailyUsage?.pdfsProcessed || 0,
    aiQuestionsLimit: dailyUsage?.aiQuestionsLimit || 5,
    cardSetsLimit: dailyUsage?.cardSetsLimit || 2,
    pdfsLimit: dailyUsage?.pdfsLimit || 1
  };

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
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Med Memo AI Dashboard</h1>
          <p className="text-xl text-gray-600">AIによる医学学習を効率化しましょう</p>
        </div>

        {/* ユーザー情報 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name || 'ユーザー'}</h2>
              <p className="text-gray-600">{user.email}</p>
              {user.university && (
                <p className="text-sm text-gray-500">{user.university} {user.grade} {user.major}</p>
              )}
            </div>
            <Link
              href="/profile"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              プロフィール編集
            </Link>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalCardSets}</div>
            <div className="text-gray-600">単語帳</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalCards}</div>
            <div className="text-gray-600">カード</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalDocs}</div>
            <div className="text-gray-600">PDF資料</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.followers}</div>
            <div className="text-gray-600">フォロワー</div>
          </div>
        </div>

        {/* 使用制限 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">今日の使用状況</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {usageLimits.aiQuestionsGenerated} / {usageLimits.aiQuestionsLimit}
              </div>
              <div className="text-gray-600">AI問題生成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {usageLimits.cardSetsStudied} / {usageLimits.cardSetsLimit}
              </div>
              <div className="text-gray-600">単語帳演習</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {usageLimits.pdfsProcessed} / {usageLimits.pdfsLimit}
              </div>
              <div className="text-gray-600">PDF処理</div>
            </div>
          </div>
        </div>

        {/* 最近の単語帳 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">最近の単語帳</h2>
            <Link href="/card-sets" className="text-blue-600 hover:text-blue-700">
              すべて見る →
            </Link>
          </div>
          {myCardSets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCardSets.map((cardSet) => (
                <div key={cardSet.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{cardSet.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cardSet.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{cardSet._count.cards}枚</span>
                    <span>{new Date(cardSet.createdAt).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <Link
                    href={`/card-sets/${cardSet.id}`}
                    className="block w-full mt-3 text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                  >
                    学習開始
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>まだ単語帳を作成していません</p>
              <Link
                href="/card-sets/create"
                className="inline-block mt-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                最初の単語帳を作成
              </Link>
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/ai-questions"
              className="bg-blue-600 text-white text-center py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <div className="text-2xl mb-2">🤖</div>
              <div className="font-semibold">AI問題作成</div>
              <div className="text-sm opacity-90">AIが問題を自動生成</div>
            </Link>
            <Link
              href="/card-sets"
              className="bg-green-600 text-white text-center py-4 px-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold">単語帳学習</div>
              <div className="text-sm opacity-90">効率的な暗記学習</div>
            </Link>
            <Link
              href="/pdf-cloze"
              className="bg-purple-600 text-white text-center py-4 px-6 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-semibold">PDF穴埋め</div>
              <div className="text-sm opacity-90">PDFから穴埋め問題作成</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Dashboard error:', error);
    // エラーが発生した場合はログインページにリダイレクト
    redirect('/auth/signin');
  }
}
