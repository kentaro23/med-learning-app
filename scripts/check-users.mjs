#!/usr/bin/env node

/**
 * ユーザー情報確認スクリプト
 * 現在のデータベースのユーザー情報を表示
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking current users...');
    
    // 全ユーザーを取得
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        grade: true,
        major: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📊 Found ${allUsers.length} user(s):`);
    console.log('=====================================');
    
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. User Details:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   University: ${user.university || 'N/A'}`);
      console.log(`   Grade: ${user.grade || 'N/A'}`);
      console.log(`   Major: ${user.major || 'N/A'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
    });
    
    // 特定のユーザーを検索
    const targetEmail = 'kentaro20040623@gmail.com';
    const targetUser = allUsers.find(u => u.email === targetEmail);
    
    if (targetUser) {
      console.log(`\n🎯 Target user (${targetEmail}) found:`);
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   Name: ${targetUser.name}`);
      console.log(`   This user will be granted admin privileges`);
    } else {
      console.log(`\n⚠️  Target user (${targetEmail}) not found`);
      console.log('   You may need to create this user first');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
