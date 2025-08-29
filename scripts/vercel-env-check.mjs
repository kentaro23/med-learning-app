#!/usr/bin/env node

/**
 * Vercel環境変数設定確認スクリプト
 * 本番環境でのデータベース接続設定を確認
 */

console.log('🔍 Vercel Environment Variables Check');
console.log('=====================================\n');

// 環境変数の確認
const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log('📊 Current Environment Variables:');
console.log('DATABASE_URL:', dbUrl ? '✅ Set' : '❌ Missing');
console.log('DIRECT_URL:', directUrl ? '✅ Set' : '❌ Missing');

if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log('\n🔗 DATABASE_URL Analysis:');
    console.log('  Host:', url.hostname);
    console.log('  Port:', url.port);
    console.log('  Database:', url.pathname.slice(1));
    console.log('  SSL Mode:', url.searchParams.get('sslmode') || 'not set');
    console.log('  PgBouncer:', url.searchParams.get('pgbouncer') || 'not set');
    console.log('  Connection Limit:', url.searchParams.get('connection_limit') || 'not set');
    
    // 推奨設定の確認
    if (url.port === '6543' && url.searchParams.get('pgbouncer') === 'true') {
      console.log('  ✅ Production/Preview setting (Transaction pooler)');
    } else if (url.port === '5432') {
      console.log('  ✅ Local development setting (Session pooler)');
    } else {
      console.log('  ⚠️  Unexpected configuration');
    }
  } catch (error) {
    console.log('  ❌ Invalid DATABASE_URL format');
  }
}

if (directUrl) {
  try {
    const url = new URL(directUrl);
    console.log('\n🔗 DIRECT_URL Analysis:');
    console.log('  Host:', url.hostname);
    console.log('  Port:', url.port);
    console.log('  Database:', url.pathname.slice(1));
    console.log('  SSL Mode:', url.searchParams.get('sslmode') || 'not set');
    
    // 推奨設定の確認
    if (url.port === '5432') {
      console.log('  ✅ Recommended setting (Session pooler)');
    } else {
      console.log('  ⚠️  Consider using port 5432 for DIRECT_URL');
    }
  } catch (error) {
    console.log('  ❌ Invalid DIRECT_URL format');
  }
}

console.log('\n📋 Recommended Vercel Environment Variables:');
console.log('============================================');
console.log('Production/Preview:');
console.log('DATABASE_URL = postgresql://...:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require');
console.log('DIRECT_URL   = postgresql://...:5432/postgres?sslmode=require');
console.log('\nLocal Development:');
console.log('DATABASE_URL = postgresql://...:5432/postgres?sslmode=require');
console.log('DIRECT_URL   = postgresql://...:5432/postgres?sslmode=require');

console.log('\n💡 Note:');
console.log('- DATABASE_URL: Use 6543 for production (Transaction pooler)');
console.log('- DIRECT_URL: Use 5432 for both environments (Session pooler)');
console.log('- Remove pgbouncer params from 5432 connections');
console.log('- Ensure sslmode=require is set');
