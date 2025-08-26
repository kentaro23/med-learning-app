import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ error: 'Use NextAuth credentials sign-in endpoint' }, { status: 405 });
}
