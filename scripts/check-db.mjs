#!/usr/bin/env node

/**
 * データベース接続チェックスクリプト
 * ビルド前にデータベース接続を確認
 */

import { PrismaClient } from '@prisma/client';
import net from 'node:net';

console.log('🔍 Database Connection Check');
console.log('============================\n');

// 環境変数の確認
const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!dbUrl || !directUrl) {
  console.error('❌ DATABASE_URL or DIRECT_URL is missing');
  console.error('Please check your environment variables');
  process.exit(1);
}

// 接続情報の解析
function parseConnectionInfo(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 5432,
      database: parsed.pathname.slice(1),
      ssl: parsed.searchParams.get('sslmode') === 'require',
      pgbouncer: parsed.searchParams.get('pgbouncer') === 'true'
    };
  } catch (error) {
    console.error('❌ Invalid URL format:', url);
    return null;
  }
}

const dbInfo = parseConnectionInfo(dbUrl);
const directInfo = parseConnectionInfo(directUrl);

if (!dbInfo || !directInfo) {
  console.error('❌ Failed to parse connection URLs');
  process.exit(1);
}

console.log('📊 Connection Information:');
console.log('DATABASE_URL:', `${dbInfo.host}:${dbInfo.port} (${dbInfo.pgbouncer ? 'PgBouncer' : 'Direct'})`);
console.log('DIRECT_URL:', `${directInfo.host}:${directInfo.port} (Direct)`);
console.log('');

// 接続テスト
async function testConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout }, () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

console.log('🌐 Testing connectivity...');
const dbConnectivity = await testConnection(dbInfo.host, dbInfo.port);
const directConnectivity = await testConnection(directInfo.host, directInfo.port);

console.log(`${dbInfo.host}:${dbInfo.port} -> ${dbConnectivity ? '✅ Connected' : '❌ Failed'}`);
console.log(`${directInfo.host}:${directInfo.port} -> ${directConnectivity ? '✅ Connected' : '❌ Failed'}`);

if (!dbConnectivity || !directConnectivity) {
  console.error('\n❌ Connection test failed');
  console.error('Please check your network and database configuration');
  process.exit(1);
}

// Prisma接続テスト
console.log('\n🔌 Testing Prisma connection...');
let prisma;
try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl
      }
    }
  });
  
  // 簡単なクエリを実行
  await prisma.$queryRaw`SELECT 1 as test`;
  console.log('✅ Prisma connection successful');
  
} catch (error) {
  console.error('❌ Prisma connection failed:', error.message);
  
  // エラーの詳細分析
  if (error.message.includes('Tenant or user not found')) {
    console.error('\n💡 This error usually means:');
    console.error('1. Database credentials are incorrect');
    console.error('2. Database user does not exist');
    console.error('3. Connection string format is wrong');
  } else if (error.message.includes('connection')) {
    console.error('\n💡 This error usually means:');
    console.error('1. Network connectivity issues');
    console.error('2. Firewall blocking connection');
    console.error('3. Database server is down');
  }
  
  process.exit(1);
} finally {
  if (prisma) {
    await prisma.$disconnect();
  }
}

console.log('\n🎉 All database checks passed!');
console.log('Ready to build and deploy.');
