/**
 * Test database connection script
 * Usage: node scripts/test-connection.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('📊 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful!', result);
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Existing tables:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Ensure database is active in Neon dashboard');
    console.error('3. Verify connection string format');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

