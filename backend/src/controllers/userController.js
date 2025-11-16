const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, username } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (username !== undefined) {
      // Check if username is taken
      const existing = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: req.user.id },
        },
      });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updateData.username = username;
    }

    // Handle file upload (only in non-serverless environments)
    if (req.file) {
      // In serverless, file is in memory (req.file.buffer)
      // For now, we'll skip file upload in serverless
      // TODO: Integrate with Vercel Blob or Cloudinary for production
      if (process.env.VERCEL) {
        // In Vercel/serverless, you need to upload to external storage
        // For now, return error or skip
        console.warn('File upload not supported in serverless environment. Use external storage.');
        return res.status(400).json({ 
          error: 'File upload not available. Please use external storage integration.' 
        });
      } else {
        // Local development - save file
        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        updateData.avatar = avatarPath;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        banner: true,
      },
    });

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const getWatchHistory = async (req, res, next) => {
  try {
    const history = await prisma.watchHistory.findMany({
      where: { userId: req.user.id },
      include: {
        match: {
          select: {
            id: true,
            title: true,
            homeTeam: true,
            awayTeam: true,
            league: true,
            thumbnail: true,
            status: true,
            matchDate: true,
          },
        },
      },
      orderBy: { watchedAt: 'desc' },
      take: 50,
    });

    res.json({ history });
  } catch (error) {
    next(error);
  }
};

const addFavoriteLeague = async (req, res, next) => {
  try {
    const { league } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user.favoriteLeagues.includes(league)) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          favoriteLeagues: {
            push: league,
          },
        },
      });
    }

    res.json({ message: 'League added to favorites' });
  } catch (error) {
    next(error);
  }
};

const removeFavoriteLeague = async (req, res, next) => {
  try {
    const { league } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    const updatedLeagues = user.favoriteLeagues.filter((l) => l !== league);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        favoriteLeagues: updatedLeagues,
      },
    });

    res.json({ message: 'League removed from favorites' });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

const reportBrokenLink = async (req, res, next) => {
  try {
    const { matchId, reason } = req.body;

    await prisma.report.create({
      data: {
        userId: req.user.id,
        matchId,
        reason,
      },
    });

    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  updatePassword,
  getWatchHistory,
  addFavoriteLeague,
  removeFavoriteLeague,
  getNotifications,
  markNotificationRead,
  reportBrokenLink,
};
