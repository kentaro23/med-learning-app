import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me called');
    
    // セッションからユーザー情報を取得
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('⚠️ No valid session found');
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // データベースからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        university: true,
        grade: true,
        major: true,
        subscriptionType: true,
        createdAt: true,
      }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ User info retrieved:', { id: user.id, email: user.email });
    
    return NextResponse.json({
      user
    });

  } catch (error) {
    console.error('❌ Get user info error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
