import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  university: z.string().min(1),
  grade: z.string().min(1),
  major: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Sign up request received');
    
    const body = await request.json();
    console.log('📋 Request body:', { ...body, password: '[HIDDEN]' });
    
    const { name, email, password, university, grade, major } = signUpSchema.parse(body);
    console.log('✅ Data validation passed');

    // 一時的にデータベースを使わずにモックデータを返す
    console.log('🎭 Using mock data for now (database issue)');
    
    // モックユーザーIDを生成
    const mockUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Mock user created successfully:', { id: mockUserId, name, email, university, grade, major });
    
    return NextResponse.json({
      success: true,
      message: 'アカウントが正常に作成されました（モックモード）',
      user: {
        id: mockUserId,
        name,
        email,
        university,
        grade,
        major,
        createdAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Sign up error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `アカウントの作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    );
  }
}
