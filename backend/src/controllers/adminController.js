const prisma = require('../utils/prisma');
const { auditLog } = require('../middleware/auditLog');

const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalMatches,
      liveMatches,
      pendingReports,
      todayStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'LIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.analytics.findUnique({ where: { date: today } }),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalMatches,
        liveMatches,
        pendingReports,
        todayUsers: todayStats?.dailyUsers || 0,
        todayPageViews: todayStats?.pageViews || 0,
        todayMatchViews: todayStats?.matchViews || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isBanned: true,
          isVerified: true,
          createdAt: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        watchHistory: {
          take: 10,
          include: {
            match: {
              select: {
                id: true,
                title: true,
                league: true,
              },
            },
          },
        },
        reports: {
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, username, firstName, lastName, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        email,
        username,
        firstName,
        lastName,
        role,
      },
    });

    await auditLog(req.user.id, 'UPDATE_USER', 'User', `Updated user ${id}`, req.ip);

    res.json({ message: 'User updated', user });
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: { isBanned: true },
    });

    await auditLog(req.user.id, 'BAN_USER', 'User', `Banned user ${id}`, req.ip);

    res.json({ message: 'User banned' });
  } catch (error) {
    next(error);
  }
};

const unbanUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: { isBanned: false },
    });

    await auditLog(req.user.id, 'UNBAN_USER', 'User', `Unbanned user ${id}`, req.ip);

    res.json({ message: 'User unbanned' });
  } catch (error) {
    next(error);
  }
};

const createMatch = async (req, res, next) => {
  try {
    const { title, homeTeam, awayTeam, league, matchDate, status = 'UPCOMING' } = req.body;

    const matchData = {
      title,
      homeTeam,
      awayTeam,
      league,
      matchDate: new Date(matchDate),
      status,
    };

    if (req.file) {
      matchData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    const match = await prisma.match.create({
      data: matchData,
    });

    await auditLog(req.user.id, 'CREATE_MATCH', 'Match', `Created match ${match.id}`, req.ip);

    res.status(201).json({ message: 'Match created', match });
  } catch (error) {
    next(error);
  }
};

const updateMatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, homeTeam, awayTeam, league, matchDate, status } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (homeTeam) updateData.homeTeam = homeTeam;
    if (awayTeam) updateData.awayTeam = awayTeam;
    if (league) updateData.league = league;
    if (matchDate) updateData.matchDate = new Date(matchDate);
    if (status) updateData.status = status;

    if (req.file) {
      updateData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
    });

    await auditLog(req.user.id, 'UPDATE_MATCH', 'Match', `Updated match ${id}`, req.ip);

    res.json({ message: 'Match updated', match });
  } catch (error) {
    next(error);
  }
};

const deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.match.delete({
      where: { id },
    });

    await auditLog(req.user.id, 'DELETE_MATCH', 'Match', `Deleted match ${id}`, req.ip);

    res.json({ message: 'Match deleted' });
  } catch (error) {
    next(error);
  }
};

const addStreamingLink = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { url, type, quality = 'HD' } = req.body;

    const link = await prisma.streamingLink.create({
      data: {
        matchId,
        url,
        type,
        quality,
      },
    });

    await auditLog(req.user.id, 'ADD_LINK', 'StreamingLink', `Added link to match ${matchId}`, req.ip);

    res.status(201).json({ message: 'Link added', link });
  } catch (error) {
    next(error);
  }
};

const updateStreamingLink = async (req, res, next) => {
  try {
    const { matchId, linkId } = req.params;
    const { url, type, quality, isActive } = req.body;

    const updateData = {};
    if (url) updateData.url = url;
    if (type) updateData.type = type;
    if (quality) updateData.quality = quality;
    if (isActive !== undefined) updateData.isActive = isActive;

    const link = await prisma.streamingLink.update({
      where: { id: linkId },
      data: updateData,
    });

    await auditLog(req.user.id, 'UPDATE_LINK', 'StreamingLink', `Updated link ${linkId}`, req.ip);

    res.json({ message: 'Link updated', link });
  } catch (error) {
    next(error);
  }
};

const deleteStreamingLink = async (req, res, next) => {
  try {
    const { linkId } = req.params;

    await prisma.streamingLink.delete({
      where: { id: linkId },
    });

    await auditLog(req.user.id, 'DELETE_LINK', 'StreamingLink', `Deleted link ${linkId}`, req.ip);

    res.json({ message: 'Link deleted' });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { status = '' } = req.query;
    const where = status ? { status } : {};

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        match: {
          select: {
            id: true,
            title: true,
            league: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const report = await prisma.report.update({
      where: { id },
      data: { status },
    });

    await auditLog(req.user.id, 'UPDATE_REPORT', 'Report', `Updated report ${id} to ${status}`, req.ip);

    res.json({ message: 'Report updated', report });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await prisma.analytics.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  createMatch,
  updateMatch,
  deleteMatch,
  addStreamingLink,
  updateStreamingLink,
  deleteStreamingLink,
  getReports,
  updateReportStatus,
  getAuditLogs,
  getAnalytics,
};

