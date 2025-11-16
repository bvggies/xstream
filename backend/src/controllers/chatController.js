const prisma = require('../utils/prisma');
const { getIO } = require('../utils/socketInstance');

const getChatHistory = async (req, res, next) => {
  try {
    // If admin, get all messages grouped by user
    // If regular user, get only their messages
    if (req.user.role === 'ADMIN') {
      // Get all unique user IDs who have sent messages
      const userMessages = await prisma.chatMessage.findMany({
        where: {
          isAdmin: false, // Only user messages
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group messages by user
      const messagesByUser = {};
      userMessages.forEach((msg) => {
        if (!messagesByUser[msg.userId]) {
          messagesByUser[msg.userId] = {
            userId: msg.userId,
            username: msg.user.username,
            email: msg.user.email,
            messages: [],
          };
        }
        messagesByUser[msg.userId].messages.push(msg);
      });

      // Also get admin replies
      const adminMessages = await prisma.chatMessage.findMany({
        where: {
          isAdmin: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Add admin messages to respective user conversations
      adminMessages.forEach((msg) => {
        if (messagesByUser[msg.userId]) {
          messagesByUser[msg.userId].messages.push(msg);
        }
      });

      // Sort messages within each conversation
      Object.keys(messagesByUser).forEach((userId) => {
        messagesByUser[userId].messages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });

      res.json({ 
        messages: Object.values(messagesByUser),
        isAdmin: true 
      });
    } else {
      // Regular user - get only their messages
      const messages = await prisma.chatMessage.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      res.json({ messages, isAdmin: false });
    }
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const io = getIO();

    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId: req.user.id,
        message,
        isAdmin: req.user.role === 'ADMIN',
      },
    });

    // Emit via Socket.io if available
    if (io) {
      if (req.user.role === 'ADMIN') {
        // Admin sending to user - need targetUserId in request
        const { targetUserId } = req.body;
        if (targetUserId) {
          io.to(`user:${targetUserId}`).emit('new_message', {
            id: chatMessage.id,
            userId: targetUserId,
            message: chatMessage.message,
            isAdmin: true,
            createdAt: chatMessage.createdAt,
            username: req.user.username,
          });
        }
      } else {
        // User sending to admin - broadcast to all admins
        io.to('admin').emit('new_message', {
          id: chatMessage.id,
          userId: req.user.id,
          username: req.user.username,
          message: chatMessage.message,
          isAdmin: false,
          createdAt: chatMessage.createdAt,
        });
        
        // Also emit to sender's room for confirmation
        io.to(`user:${req.user.id}`).emit('new_message', {
          id: chatMessage.id,
          userId: req.user.id,
          message: chatMessage.message,
          isAdmin: false,
          createdAt: chatMessage.createdAt,
          username: req.user.username,
        });
      }
    }

    res.status(201).json({ message: chatMessage });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.chatMessage.count({
      where: {
        userId: req.user.id,
        isSeen: false,
        isAdmin: true, // Only count admin messages as unread for users
      },
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

const markMessagesAsSeen = async (req, res, next) => {
  try {
    await prisma.chatMessage.updateMany({
      where: {
        userId: req.user.id,
        isSeen: false,
      },
      data: {
        isSeen: true,
      },
    });

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
  getUnreadCount,
  markMessagesAsSeen,
};

