const prisma = require('../utils/prisma');
const { getIO } = require('../utils/socketInstance');

const getMatchChatHistory = async (req, res, next) => {
  try {
    const { matchId } = req.params;

    // Verify match exists
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, status: true, endTime: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Get chat messages for this match
    const messages = await prisma.matchChat.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 200, // Limit to last 200 messages
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const sendMatchChatMessage = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { message } = req.body;
    const io = getIO();

    // Verify match exists and is not finished
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, status: true, endTime: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Don't allow chat if match has ended
    if (match.status === 'FINISHED' || (match.endTime && new Date(match.endTime) < new Date())) {
      return res.status(400).json({ error: 'Chat is closed for finished matches' });
    }

    // Create chat message
    const chatMessage = await prisma.matchChat.create({
      data: {
        matchId,
        userId: req.user.id,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Emit via Socket.io if available
    if (io) {
      io.to(`match:${matchId}`).emit('match_chat_message', {
        id: chatMessage.id,
        matchId,
        userId: chatMessage.userId,
        username: chatMessage.user.username,
        avatar: chatMessage.user.avatar,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt,
      });
    }

    res.status(201).json({ message: chatMessage });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMatchChatHistory,
  sendMatchChatMessage,
};

