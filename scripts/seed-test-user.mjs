#!/usr/bin/env node

/**
 * テストユーザーシードスクリプト
 * tester@example.com / Passw0rd! でログインできるユーザーを作成
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestUser() {
  try {
    console.log('🌱 Seeding test user...');
    
    const testEmail = 'tester@example.com';
    const testPassword = 'Passw0rd!';
    
    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(testPassword, 12);
    
    // テストユーザーをupsert（存在しない場合は作成、存在する場合は更新）
    const userData = {
      name: 'Test User',
      passwordHash: passwordHash,
      university: 'Test University',
      grade: 'Test Grade',
      major: 'Test Major'
    };
    
    const testUser = await prisma.user.upsert({
      where: { email: testEmail },
      update: userData,
      create: {
        email: testEmail,
        ...userData
      }
    });
    
    console.log('✅ Test user created/updated successfully:');
    console.log(JSON.stringify(testUser, null, 2));
    
    console.log('\n🔑 Test credentials:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    
    console.log('\n💡 You can now test login with these credentials');
    
  } catch (error) {
    console.error('❌ Error seeding test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUser();
