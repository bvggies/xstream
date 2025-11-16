const prisma = require('../utils/prisma');
const { auditLog } = require('../middleware/auditLog');

const getAllHighlights = async (req, res, next) => {
  try {
    const { search, league, isVisible } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { league: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (league) {
      where.league = league;
    }

    if (isVisible !== undefined) {
      where.isVisible = isVisible === 'true';
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ highlights });
  } catch (error) {
    next(error);
  }
};

const createHighlight = async (req, res, next) => {
  try {
    const {
      title,
      description,
      matchId,
      league,
      thumbnailUrl,
      videoLinks,
      duration,
      isVisible = true,
      homeScore,
      awayScore,
      statistics,
    } = req.body;

    // Validate videoLinks is an array
    const linksArray = Array.isArray(videoLinks) ? videoLinks : [videoLinks].filter(Boolean);

    if (linksArray.length === 0) {
      return res.status(400).json({ error: 'At least one video link is required' });
    }

    const highlight = await prisma.highlight.create({
      data: {
        title,
        description: description || null,
        matchId: matchId || null,
        league,
        thumbnailUrl,
        videoLinks: linksArray,
        duration: duration ? parseInt(duration) : null,
        isVisible,
        homeScore: homeScore ? parseInt(homeScore) : null,
        awayScore: awayScore ? parseInt(awayScore) : null,
        statistics: statistics ? (typeof statistics === 'string' ? statistics : JSON.stringify(statistics)) : null,
      },
    });

    await auditLog(req.user.id, 'CREATE_HIGHLIGHT', 'Highlight', `Created highlight ${highlight.id}`, req.ip);

    res.status(201).json({ message: 'Highlight created', highlight });
  } catch (error) {
    next(error);
  }
};

const updateHighlight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      matchId,
      league,
      thumbnailUrl,
      videoLinks,
      duration,
      isVisible,
      homeScore,
      awayScore,
      statistics,
    } = req.body;

    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (matchId !== undefined) updateData.matchId = matchId || null;
    if (league) updateData.league = league;
    if (thumbnailUrl) updateData.thumbnailUrl = thumbnailUrl;
    if (videoLinks) {
      const linksArray = Array.isArray(videoLinks) ? videoLinks : [videoLinks].filter(Boolean);
      if (linksArray.length > 0) {
        updateData.videoLinks = linksArray;
      }
    }
    if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null;
    if (isVisible !== undefined) updateData.isVisible = isVisible;
    if (homeScore !== undefined) updateData.homeScore = homeScore ? parseInt(homeScore) : null;
    if (awayScore !== undefined) updateData.awayScore = awayScore ? parseInt(awayScore) : null;
    if (statistics !== undefined) {
      updateData.statistics = statistics ? (typeof statistics === 'string' ? statistics : JSON.stringify(statistics)) : null;
    }

    const highlight = await prisma.highlight.update({
      where: { id },
      data: updateData,
    });

    await auditLog(req.user.id, 'UPDATE_HIGHLIGHT', 'Highlight', `Updated highlight ${id}`, req.ip);

    res.json({ message: 'Highlight updated', highlight });
  } catch (error) {
    next(error);
  }
};

const deleteHighlight = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.highlight.delete({
      where: { id },
    });

    await auditLog(req.user.id, 'DELETE_HIGHLIGHT', 'Highlight', `Deleted highlight ${id}`, req.ip);

    res.json({ message: 'Highlight deleted' });
  } catch (error) {
    next(error);
  }
};

const toggleVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;

    const highlight = await prisma.highlight.findUnique({
      where: { id },
      select: { isVisible: true },
    });

    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    const updated = await prisma.highlight.update({
      where: { id },
      data: { isVisible: !highlight.isVisible },
    });

    await auditLog(
      req.user.id,
      'TOGGLE_HIGHLIGHT',
      'Highlight',
      `${updated.isVisible ? 'Enabled' : 'Disabled'} highlight ${id}`,
      req.ip
    );

    res.json({ message: `Highlight ${updated.isVisible ? 'enabled' : 'disabled'}`, highlight: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllHighlights,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  toggleVisibility,
};

