/* runtime: Node.js (Prismaを使うのでEdge不可) */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

/** ==== Prisma (dev再インスタンス防止) ==== */
const g = globalThis as unknown as { prisma?: PrismaClient };
const prisma =
  g.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

/** ==== OpenAI ==== */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** ==== 簡易レート制限 (IPベース 1分3回) ==== */
const hits = new Map<string, number[]>();
function rateLimit(key: string, limit = 3, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now);
  hits.set(key, arr);
  return true;
}

/** ==== スキーマ ==== */
const ReqSchema = z.object({
  text: z.string().min(10).max(20_000),
  count: z.number().int().min(5).max(25).default(12),
  source: z.string().optional().default("user-input"),
  language: z.enum(["ja", "en"]).optional().default("ja"),
});

const CardSchema = z.object({
  question: z.string().min(3).max(200),
  answer: z.string().min(1).max(200),
  source: z.string().optional(),
});
const ResSchema = z.object({ cards: z.array(CardSchema).min(1).max(30) });

/** ==== System Prompt ==== */
const SYSTEM_PROMPT = `
あなたは医学教育に特化した問題作成アシスタントです。
入力テキスト（講義ノート/教科書/スライドの抜粋）から、CBT/国試対策向けの「1問1答」Q&Aカードを作成してください。

必須ルール:
- 医学用語は正確かつ簡潔。1カード = {question, answer, source?}
- questionは1文で明確な問い。answerは核心語〜1文
- 重複や曖昧/多義的な問題は作らない
- 易〜標準中心（難問は少数）
- 指定countを厳守
- 返答は必ず JSON オブジェクト {"cards":[...]} のみ。前後の説明文は禁止
`.trim();

/** ==== Utils ==== */
function sanitize(s: string) {
  return s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

function dedupe(cards: z.infer<typeof CardSchema>[]) {
  const seen = new Set<string>();
  const out: typeof cards = [];
  
  for (const card of cards) {
    const key = `${sanitize(card.question.toLowerCase())}|${sanitize(card.answer.toLowerCase())}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(card);
    }
  }
  
  return out;
}

/** ==== Main Handler ==== */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // レート制限チェック
    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(clientIP)) {
      return NextResponse.json(
        { ok: false, error: "レート制限を超過しました。1分後に再試行してください。" },
        { status: 429 }
      );
    }

    // カードセットの存在確認
    const cardSet = await prisma.cardSet.findUnique({
      where: { id: params.id },
      include: { cards: true },
    });

    if (!cardSet) {
      return NextResponse.json(
        { ok: false, error: "カードセットが見つかりません" },
        { status: 404 }
      );
    }

    // リクエストボディの検証
    const body = await request.json();
    const validatedData = ReqSchema.parse(body);

    // OpenAI APIを使用してカードを生成
    const userPrompt = `以下のテキストから${validatedData.count}問の医学問題を作成してください：

テキスト: ${validatedData.text}
言語: ${validatedData.language}
ソース: ${validatedData.source}

必ず以下のJSON形式で返してください：
{"cards":[{"question":"問題文","answer":"解答","source":"ソース"}]}`;

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("タイムアウト")), 45000)
      ),
    ]) as OpenAI.Chat.Completions.ChatCompletion;

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI APIからの応答が空です");
    }

    // JSONパースと検証
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (error) {
      throw new Error("OpenAI APIからの応答が有効なJSONではありません");
    }

    const validatedResponse = ResSchema.parse(parsedResponse);

    // 重複除去
    const uniqueCards = dedupe(validatedResponse.cards);

    if (uniqueCards.length === 0) {
      return NextResponse.json(
        { ok: false, error: "すべてのカードが重複しています" },
        { status: 400 }
      );
    }

    // カードを一括保存
    const savedCards = await prisma.card.createMany({
      data: uniqueCards.map(card => ({
        question: card.question,
        answer: card.answer,
        source: card.source || validatedData.source,
        cardSetId: params.id,
      })),
    });

    return NextResponse.json({
      ok: true,
      cards: uniqueCards,
      saved: savedCards.count,
      duplicates: validatedResponse.cards.length - uniqueCards.length,
    });

  } catch (error) {
    console.error("Card generation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "無効なリクエストデータです" },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes("タイムアウト")) {
        return NextResponse.json(
          { ok: false, error: "リクエストがタイムアウトしました" },
          { status: 408 }
        );
      }
      
      if (error.message.includes("OPENAI_API_KEY")) {
        return NextResponse.json(
          { ok: false, error: "OpenAI APIキーが設定されていません" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { ok: false, error: "カードの生成に失敗しました" },
      { status: 500 }
    );
  }
}
