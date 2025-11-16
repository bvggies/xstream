const prisma = require('../utils/prisma');

const getChatHistory = async (req, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        message,
        isAdmin: req.user.role === 'ADMIN',
      },
    });

    res.status(201).json({ message: chatMessage });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
};

