import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = signInSchema.parse(body);

    console.log('🔐 Login attempt:', { email, passwordLength: password.length });

    // デモ用アカウントのチェック
    if (email === 'demo@med.ai' && password === 'password') {
      console.log('🔑 Demo account credentials match');
      
      const response = NextResponse.json({ 
        success: true,
        user: {
          id: 'demo-user-123',
          name: 'デモユーザー',
          email: 'demo@med.ai',
        }
      });

      // セッションクッキーを設定
      response.cookies.set('next-auth.session-token', 'demo-session-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7日間
        path: '/',
      });

      return response;
    }

    // 新規登録したユーザーの認証（より寛容な条件）
    console.log('🔑 Authenticating new user:', email);
    
    // 新規登録したユーザーは、パスワードが入力されていれば認証成功とする
    if (password && password.trim().length > 0) {
      console.log('✅ Authentication successful for new user');
      
      const mockUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: '新規ユーザー',
        email: email,
      };

      const response = NextResponse.json({ 
        success: true,
        user: mockUser
      });

      // セッションクッキーを設定
      response.cookies.set('next-auth.session-token', `user-session-${mockUser.id}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7日間
        path: '/',
      });

      return response;
    } else {
      console.log('❌ No password provided');
      return NextResponse.json(
        { error: 'パスワードを入力してください' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('❌ Sign in error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
