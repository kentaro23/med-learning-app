#!/usr/bin/env node

/**
 * 管理者権限付与スクリプト
 * 特定のメールアドレスに管理者権限を付与
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdmin() {
  try {
    console.log('🔧 Setting admin privileges...');
    
    const adminEmail = 'kentaro20040623@gmail.com';
    
    // まず、必要なフィールドが存在するかチェック
    console.log('🔍 Checking database schema...');
    
    try {
      // 全ユーザーを取得してスキーマを確認
      const allUsers = await prisma.user.findMany({
        take: 1,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });
      
      console.log('✅ Database connection successful');
      console.log('📊 Current user count:', allUsers.length);
      
    } catch (error) {
      console.error('❌ Database schema error:', error.message);
      console.log('💡 You may need to run database migrations first');
      return;
    }
    
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!user) {
      console.log(`❌ User with email ${adminEmail} not found`);
      console.log('Creating admin user...');
      
      // 管理者ユーザーを作成
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Kentaro Admin',
          university: 'Admin University',
          grade: 'Admin',
          major: 'Administration'
        }
      });
      
      console.log('✅ Admin user created:', adminUser);
    } else {
      console.log(`✅ User found: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
    }
    
    // 全ユーザーの一覧を表示
    console.log('\n📊 All users:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('1. Run database migrations to add admin fields');
    console.log('2. Update the set-admin script to use the new fields');
    console.log('3. Create admin dashboard for user management');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();
