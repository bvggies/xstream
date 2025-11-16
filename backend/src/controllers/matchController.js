const prisma = require('../utils/prisma');

const getMatches = async (req, res, next) => {
  try {
    const { status, league } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    } else {
      // Default: show LIVE and UPCOMING
      where.status = { in: ['LIVE', 'UPCOMING'] };
    }

    if (league) {
      where.league = league;
    }

    // Hide expired matches
    if (status === 'UPCOMING' || !status) {
      where.matchDate = { gte: new Date() };
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        streamingLinks: {
          where: { isActive: true },
          select: {
            id: true,
            url: true,
            type: true,
            quality: true,
            views: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // LIVE first
        { matchDate: 'asc' },
      ],
      take: 100,
    });

    res.json({ matches });
  } catch (error) {
    next(error);
  }
};

const getMatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        homeTeam: true,
        awayTeam: true,
        homeTeamLogo: true,
        awayTeamLogo: true,
        league: true,
        leagueLogo: true,
        thumbnail: true,
        status: true,
        matchDate: true,
        streamingLinks: {
          where: { isActive: true },
          select: {
            id: true,
            url: true,
            type: true,
            quality: true,
            views: true,
          },
          orderBy: { views: 'desc' },
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({ match });
  } catch (error) {
    next(error);
  }
};

const watchMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Add to watch history
    await prisma.watchHistory.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId: id,
        },
      },
      update: {
        watchedAt: new Date(),
      },
      create: {
        userId,
        matchId: id,
      },
    });

    // Increment link views if linkId provided
    const { linkId } = req.body;
    if (linkId) {
      await prisma.streamingLink.update({
        where: { id: linkId },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    // Update analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: { date: today },
      update: {
        matchViews: {
          increment: 1,
        },
      },
      create: {
        date: today,
        matchViews: 1,
      },
    });

    res.json({ message: 'Match watched' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatches,
  getMatchById,
  watchMatch,
};

