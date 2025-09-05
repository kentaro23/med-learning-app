export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { PrismaClient as DirectPrismaClient } from '@prisma/client';

async function withPrismaFallback<T>(fn: (client: any) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (e: any) {
    if (!process.env.DIRECT_URL) throw e;
    const direct = new DirectPrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
    try {
      return await fn(direct);
    } finally {
      await direct.$disconnect().catch(() => {});
    }
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, name, school } = await req.json();

    // 入力検証
    if (!email || !password) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }
    const normEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 });
    }

    // 既存確認（フォールバック対応）
    const exists = await withPrismaFallback((client) => client.user.findUnique({ where: { email: normEmail } }));

    const passwordHash = await bcrypt.hash(String(password), 10);

    if (exists) {
      // 暫定: 既存ユーザーでもパスワードを上書きし、登録成功扱いにする
      await withPrismaFallback((client) => client.user.update({
        where: { id: exists.id },
        data: {
          passwordHash,
          name: (String(name || '').trim() || exists.name) ?? null,
          school: (String(school || '').trim() || exists.school) ?? null,
        },
      }));
      return NextResponse.json({ ok: true, updated: true, reset: true });
    }

    // 新規作成（フォールバック対応）
    try {
      await withPrismaFallback((client) => client.user.create({
        data: {
          email: normEmail,
          passwordHash,
          name: String(name || '').trim() || null,
          school: String(school || '').trim() || null,
        },
      }));
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      // 衝突時も上書き（レース対策）
      if (e?.code === 'P2002') {
        const found = await withPrismaFallback((client) => client.user.findUnique({ where: { email: normEmail } }));
        if (found) {
          await withPrismaFallback((client) => client.user.update({
            where: { id: found.id },
            data: { passwordHash, name: String(name || '').trim() || found.name, school: String(school || '').trim() || found.school },
          }));
          return NextResponse.json({ ok: true, updated: true, reset: true });
        }
      }
      console.error('signup create error:', e);
      return NextResponse.json({ error: 'internal' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('signup error', e?.message || e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
