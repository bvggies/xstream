const prisma = require('./prisma');

/**
 * Track page view
 */
const trackPageView = async (req) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: { date: today },
      update: {
        pageViews: {
          increment: 1,
        },
      },
      create: {
        date: today,
        pageViews: 1,
      },
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

/**
 * Track daily user
 */
const trackDailyUser = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user already counted today
    const existing = await prisma.analytics.findUnique({
      where: { date: today },
    });

    if (!existing) {
      await prisma.analytics.create({
        data: {
          date: today,
          dailyUsers: 1,
        },
      });
    } else {
      // For simplicity, we'll increment. In production, you'd want to track unique users
      await prisma.analytics.update({
        where: { date: today },
        data: {
          dailyUsers: {
            increment: 1,
          },
        },
      });
    }
  } catch (error) {
    console.error('Daily user tracking error:', error);
  }
};

module.exports = {
  trackPageView,
  trackDailyUser,
};

