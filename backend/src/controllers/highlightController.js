const prisma = require('../utils/prisma');

const getHighlights = async (req, res, next) => {
  try {
    const { league, team, date, sort = 'newest' } = req.query;
    const where = {
      isVisible: true,
    };

    if (league) {
      where.league = league;
    }

    if (team) {
      where.OR = [
        { title: { contains: team, mode: 'insensitive' } },
        { description: { contains: team, mode: 'insensitive' } },
      ];
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'mostViewed') {
      orderBy = { views: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const highlights = await prisma.highlight.findMany({
      where,
      include: {
        match: {
          select: {
            id: true,
            title: true,
            homeTeam: true,
            awayTeam: true,
            league: true,
          },
        },
      },
      orderBy,
      take: 100,
    });

    res.json({ highlights });
  } catch (error) {
    next(error);
  }
};

const getHighlightById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const highlight = await prisma.highlight.findUnique({
      where: { id },
      include: {
        match: {
          select: {
            id: true,
            title: true,
            homeTeam: true,
            awayTeam: true,
            league: true,
            matchDate: true,
          },
        },
      },
    });

    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    // Increment views
    await prisma.highlight.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Get related highlights (same league)
    const relatedHighlights = await prisma.highlight.findMany({
      where: {
        id: { not: id },
        league: highlight.league,
        isVisible: true,
      },
      take: 6,
      orderBy: { views: 'desc' },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        views: true,
        duration: true,
        createdAt: true,
      },
    });

    res.json({ highlight, relatedHighlights });
  } catch (error) {
    next(error);
  }
};

const incrementViews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const highlight = await prisma.highlight.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { views: true },
    });

    res.json({ views: highlight.views });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHighlights,
  getHighlightById,
  incrementViews,
};

