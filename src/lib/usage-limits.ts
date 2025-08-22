import { prisma } from './prisma';

export interface UsageLimits {
  aiQuestionsGenerated: number;
  cardSetsStudied: number;
  pdfsProcessed: number;
  aiQuestionsLimit: number;
  cardSetsLimit: number;
  pdfsLimit: number;
}

export interface UsageCheckResult {
  canUse: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  message: string;
}

export async function checkUsageLimit(
  userId: string,
  feature: 'aiQuestions' | 'cardSets' | 'pdfs'
): Promise<UsageCheckResult> {
  try {
    console.log('🔍 Checking usage limit for user:', userId, 'feature:', feature);
    
    // ユーザーのサブスクリプション情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dailyUsage: true }
    });

    console.log('👤 User found:', user ? { id: user.id, email: user.email, hasDailyUsage: !!user.dailyUsage } : 'Not found');

    if (!user) {
      return {
        canUse: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        message: 'ユーザーが見つかりません'
      };
    }

    // デモアカウントの場合は制限なし
    if (user.email === 'demo@med.ai') {
      return {
        canUse: true,
        currentUsage: 0,
        limit: -1, // -1は無制限を表す
        remaining: -1,
        message: 'デモアカウント: 無制限で利用可能'
      };
    }

    // プレミアムユーザーは制限なし
    if (user.subscriptionType === 'premium' && 
        user.subscriptionExpiresAt && 
        user.subscriptionExpiresAt > new Date()) {
      return {
        canUse: true,
        currentUsage: 0,
        limit: -1, // 無制限
        remaining: -1,
        message: 'プレミアムユーザーは無制限で利用できます'
      };
    }

    // 今日の日付を取得（日本時間）
    const today = new Date();
    const japanTime = new Date(today.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const todayStart = new Date(japanTime.getFullYear(), japanTime.getMonth(), japanTime.getDate());

    // 今日の使用状況を取得または作成
    let dailyUsage = user.dailyUsage;
    
    if (!dailyUsage || dailyUsage.date < todayStart) {
      // 新しい日または初回使用の場合
      dailyUsage = await prisma.dailyUsage.upsert({
        where: { userId },
        update: {
          date: todayStart,
          aiQuestionsGenerated: 0,
          cardSetsStudied: 0,
          pdfsProcessed: 0
        },
        create: {
          userId,
          date: todayStart,
          aiQuestionsGenerated: 0,
          cardSetsStudied: 0,
          pdfsProcessed: 0
        }
      });
    }

    // DailyUsageが存在しない場合は作成
    if (!dailyUsage) {
      dailyUsage = await prisma.dailyUsage.create({
        data: {
          userId,
          date: todayStart,
          aiQuestionsGenerated: 0,
          cardSetsStudied: 0,
          pdfsProcessed: 0
        }
      });
    }

    // 機能別の制限チェック
    let currentUsage: number;
    let limit: number;
    let featureName: string;

    switch (feature) {
      case 'aiQuestions':
        currentUsage = dailyUsage.aiQuestionsGenerated;
        limit = dailyUsage.aiQuestionsLimit;
        featureName = 'AI問題生成';
        break;
      case 'cardSets':
        currentUsage = dailyUsage.cardSetsStudied;
        limit = dailyUsage.cardSetsLimit;
        featureName = '単語帳演習';
        break;
      case 'pdfs':
        currentUsage = dailyUsage.pdfsProcessed;
        limit = dailyUsage.pdfsLimit;
        featureName = 'PDF処理';
        break;
      default:
        return {
          canUse: false,
          currentUsage: 0,
          limit: 0,
          remaining: 0,
          message: '不明な機能です'
        };
    }

    const remaining = limit - currentUsage;
    const canUse = currentUsage < limit;

    return {
      canUse,
      currentUsage,
      limit,
      remaining,
      message: canUse 
        ? `${featureName}の利用可能回数: ${remaining}回`
        : `${featureName}の1日の制限に達しました。プレミアムプランにアップグレードすると無制限で利用できます。`
    };
  } catch (error) {
    console.error('Usage limit check error:', error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return {
      canUse: false,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
      message: `使用制限の確認中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    };
  }
}

export async function incrementUsage(
  userId: string,
  feature: 'aiQuestions' | 'cardSets' | 'pdfs'
): Promise<void> {
  try {
    const today = new Date();
    const japanTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    const todayStart = new Date(japanTime.getFullYear(), japanTime.getMonth(), japanTime.getDate());

    // 使用回数をインクリメント
    await prisma.dailyUsage.upsert({
      where: { userId },
      update: {
        [feature === 'aiQuestions' ? 'aiQuestionsGenerated' :
         feature === 'cardSets' ? 'cardSetsStudied' : 'pdfsProcessed']: {
          increment: 1
        }
      },
      create: {
        userId,
        date: todayStart,
        aiQuestionsGenerated: feature === 'aiQuestions' ? 1 : 0,
        cardSetsStudied: feature === 'cardSets' ? 1 : 0,
        pdfsProcessed: feature === 'pdfs' ? 1 : 0
      }
    });
  } catch (error) {
    console.error('Usage increment error:', error);
  }
}

export async function getUserUsageSummary(userId: string): Promise<UsageLimits | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dailyUsage: true }
    });

    if (!user || !user.dailyUsage) {
      return null;
    }

    return {
      aiQuestionsGenerated: user.dailyUsage.aiQuestionsGenerated,
      cardSetsStudied: user.dailyUsage.cardSetsStudied,
      pdfsProcessed: user.dailyUsage.pdfsProcessed,
      aiQuestionsLimit: user.dailyUsage.aiQuestionsLimit,
      cardSetsLimit: user.dailyUsage.cardSetsLimit,
      pdfsLimit: user.dailyUsage.pdfsLimit
    };
  } catch (error) {
    console.error('Get usage summary error:', error);
    return null;
  }
}
