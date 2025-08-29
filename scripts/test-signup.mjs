#!/usr/bin/env node

/**
 * テスト用サインアップスクリプト
 * 開発環境でアカウント作成をテストするために使用
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🧪 Creating test user...');
    
    const testUser = {
      name: 'テストユーザー',
      email: 'test@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      university: 'テスト大学',
      grade: '1年生',
      major: 'テスト学部',
    };

    const user = await prisma.user.create({
      data: testUser,
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        grade: true,
        major: true,
        createdAt: true,
      }
    });

    console.log('✅ Test user created successfully:');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('\n📧 Login credentials:');
    console.log(`Email: ${testUser.email}`);
    console.log('Password: password123');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Test user already exists');
    } else {
      console.error('❌ Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
