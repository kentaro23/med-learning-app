import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // テストユーザーの作成
  const hashedPassword = await bcrypt.hash('demo1234', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@med.ai' },
    update: {},
    create: {
      email: 'demo@med.ai',
      name: 'テストユーザー',
      password: hashedPassword,
      university: '東京医科大学',
      major: '医学部',
      grade: '3年生',
      subscriptionType: 'free', // デモ版は無料プランだが、使用制限は無制限
    },
  });

  console.log('✅ User created:', user.email);

  // CardSetの作成
  const cardSet = await prisma.cardSet.upsert({
    where: { 
      id: 'seed-cardset-001' 
    },
    update: {},
    create: {
      id: 'seed-cardset-001',
      title: '循環器 基礎',
      description: '循環器系の基本的な知識を学ぶためのカードセット',
      visibility: 'public',
      tags: '循環器,心臓,血管,基礎',
      ownerId: user.id,
    },
  });

  console.log('✅ CardSet created:', cardSet.title);

  // Q&Aカードの作成
  const cards = await Promise.all([
    prisma.card.upsert({
      where: { 
        id: 'seed-card-001' 
      },
      update: {},
      create: {
        id: 'seed-card-001',
        question: '心臓の主な役割は何ですか？',
        answer: '血液を全身に送り出すポンプ機能',
        source: '循環器学基礎',
        cardSetId: cardSet.id,
      },
    }),
    prisma.card.upsert({
      where: { 
        id: 'seed-card-002' 
      },
      update: {},
      create: {
        id: 'seed-card-002',
        question: '心臓の4つの部屋の名称を答えてください。',
        answer: '右心房、右心室、左心房、左心室',
        source: '循環器学基礎',
        cardSetId: cardSet.id,
      },
    }),
    prisma.card.upsert({
      where: { 
        id: 'seed-card-003' 
      },
      update: {},
      create: {
        id: 'seed-card-003',
        question: '心臓の収縮期と拡張期の違いは何ですか？',
        answer: '収縮期は心臓が収縮して血液を送り出す時期、拡張期は心臓が拡張して血液を充満させる時期',
        source: '循環器学基礎',
        cardSetId: cardSet.id,
      },
    }),
  ]);

  console.log('✅ Cards created:', cards.length, 'cards');

  // 検索テスト用の追加CardSetを作成
  const additionalCardSet = await prisma.cardSet.upsert({
    where: { 
      id: 'seed-cardset-002' 
    },
    update: {},
    create: {
      id: 'seed-cardset-002',
      title: '神経系 基礎',
      description: '神経系の基本的な構造と機能を学ぶためのカードセット',
      visibility: 'public',
      tags: '神経系,脳,脊髄,神経,基礎',
      ownerId: user.id,
    },
  });

  console.log('✅ Additional CardSet created:', additionalCardSet.title);

  // 追加のQ&Aカードを作成
  const additionalCards = await Promise.all([
    prisma.card.upsert({
      where: { 
        id: 'seed-card-004' 
      },
      update: {},
      create: {
        id: 'seed-card-004',
        question: '神経系の基本単位は何ですか？',
        answer: 'ニューロン（神経細胞）',
        source: '神経学基礎',
        cardSetId: additionalCardSet.id,
      },
    }),
    prisma.card.upsert({
      where: { 
        id: 'seed-card-005' 
      },
      update: {},
      create: {
        id: 'seed-card-005',
        question: '脳の主要な部分を3つ答えてください。',
        answer: '大脳、小脳、脳幹',
        source: '神経学基礎',
        cardSetId: additionalCardSet.id,
      },
    }),
  ]);

  console.log('✅ Additional Cards created:', additionalCards.length, 'cards');

  // 統計情報の表示
  const userCount = await prisma.user.count();
  const cardSetCount = await prisma.cardSet.count();
  const cardCount = await prisma.card.count();

  console.log('\n📊 Database Summary:');
  console.log(`Users: ${userCount}`);
  console.log(`CardSets: ${cardSetCount}`);
  console.log(`Cards: ${cardCount}`);

  console.log('\n🎯 Test Account:');
  console.log('Email: demo@med.ai');
  console.log('Password: demo1234');
  console.log('\n🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
