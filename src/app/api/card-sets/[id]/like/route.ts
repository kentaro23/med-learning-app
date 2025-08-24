import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: implement like/unlike logic with Prisma later
  return NextResponse.json({ ok: true });
}

// Optional: avoid static optimization on API route
export const dynamic = 'force-dynamic';
