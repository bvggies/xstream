/**
 * Seed script to populate database with sample data
 * Usage: node scripts/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@xstream.com' },
      update: {},
      create: {
        email: 'admin@xstream.com',
        username: 'admin',
        password: adminPassword,
        role: 'ADMIN',
        isVerified: true,
        firstName: 'Admin',
        lastName: 'User',
      },
    });
    console.log('✅ Admin user created');

    // Create test user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
      where: { email: 'user@xstream.com' },
      update: {},
      create: {
        email: 'user@xstream.com',
        username: 'testuser',
        password: userPassword,
        role: 'USER',
        isVerified: true,
        firstName: 'Test',
        lastName: 'User',
      },
    });
    console.log('✅ Test user created');

    // Create sample matches
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    const match1 = await prisma.match.upsert({
      where: { id: 'sample-match-1' },
      update: {},
      create: {
        id: 'sample-match-1',
        title: 'Manchester United vs Liverpool',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        status: 'UPCOMING',
        matchDate: tomorrow,
      },
    });
    console.log('✅ Sample match 1 created');

    const match2 = await prisma.match.upsert({
      where: { id: 'sample-match-2' },
      update: {},
      create: {
        id: 'sample-match-2',
        title: 'Barcelona vs Real Madrid',
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        league: 'La Liga',
        status: 'UPCOMING',
        matchDate: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ Sample match 2 created');

    // Create streaming links (example URLs - replace with real ones)
    await prisma.streamingLink.upsert({
      where: { id: 'sample-link-1' },
      update: {},
      create: {
        id: 'sample-link-1',
        matchId: match1.id,
        url: 'https://example.com/stream1.m3u8',
        type: 'HLS',
        quality: 'HD',
        isActive: true,
      },
    });

    await prisma.streamingLink.upsert({
      where: { id: 'sample-link-2' },
      update: {},
      create: {
        id: 'sample-link-2',
        matchId: match2.id,
        url: 'https://example.com/stream2.m3u8',
        type: 'HLS',
        quality: 'HD',
        isActive: true,
      },
    });
    console.log('✅ Streaming links created');

    console.log('\n🎉 Seeding completed!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: admin@xstream.com / admin123');
    console.log('User: user@xstream.com / user123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

