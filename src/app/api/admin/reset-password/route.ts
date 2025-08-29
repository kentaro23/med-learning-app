import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const adminToken = req.headers.get('x-reset-token') || req.nextUrl.searchParams.get('token');
    if (!adminToken || adminToken !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'missing' }, { status: 400 });
    }

    const normEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findFirst({ where: { email: { equals: normEmail, mode: 'insensitive' } } });
    if (!user) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true, id: user.id });
  } catch (e) {
    console.error('admin reset-password error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}


