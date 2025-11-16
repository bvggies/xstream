const prisma = require('../utils/prisma');
const { verifyAccessToken } = require('../utils/jwt');

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('accessToken=')[1]?.split(';')[0];

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyAccessToken(token);

      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      socket.isAdmin = user.role === 'ADMIN';

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // If admin, join admin room
    if (socket.isAdmin) {
      socket.join('admin');
    }

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { message, targetUserId } = data;

        // Save message to database
        const chatMessage = await prisma.chatMessage.create({
          data: {
            userId: targetUserId || socket.userId,
            message,
            isAdmin: socket.isAdmin,
          },
        });

        // Emit to target user
        if (targetUserId) {
          io.to(`user:${targetUserId}`).emit('new_message', {
            id: chatMessage.id,
            message: chatMessage.message,
            isAdmin: chatMessage.isAdmin,
            createdAt: chatMessage.createdAt,
            username: socket.username,
          });
        } else {
          // User message to admin
          io.to('admin').emit('new_message', {
            id: chatMessage.id,
            userId: socket.userId,
            username: socket.username,
            message: chatMessage.message,
            isAdmin: false,
            createdAt: chatMessage.createdAt,
          });
        }

        // Confirm to sender
        socket.emit('message_sent', { id: chatMessage.id });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { targetUserId } = data;
      if (targetUserId) {
        socket.to(`user:${targetUserId}`).emit('user_typing', {
          username: socket.username,
        });
      } else if (socket.isAdmin) {
        io.to('admin').emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username}`);
    });
  });
};

module.exports = { initializeSocket };

