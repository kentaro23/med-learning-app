import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

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
    if (email === 'demo@med.ai' && password === 'demo1234') {
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

    // 新規登録したユーザーの認証（データベースから検索）
    console.log('🔑 Authenticating registered user:', email);
    
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 401 }
        );
      }

      // パスワードの検証
      if (user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          console.log('❌ Invalid password for user:', email);
          return NextResponse.json(
            { error: 'パスワードが正しくありません' },
            { status: 401 }
          );
        }
      } else {
        // パスワードフィールドがない場合（NextAuth.jsのOAuthユーザーなど）
        console.log('❌ No password field for user:', email);
        return NextResponse.json(
          { error: 'このアカウントではパスワード認証が利用できません' },
          { status: 401 }
        );
      }

      console.log('✅ Authentication successful for registered user:', email);
      
      const response = NextResponse.json({ 
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      });

      // セッションクッキーを設定
      response.cookies.set('next-auth.session-token', `user-session-${user.id}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7日間
        path: '/',
      });

      return response;
    } catch (dbError) {
      console.error('❌ Database error during authentication:', dbError);
      return NextResponse.json(
        { error: '認証処理中にエラーが発生しました' },
        { status: 500 }
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
