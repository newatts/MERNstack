import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { User, Message } from '../models';

type AuthenticatedSocket = Socket & {
  userId?: string;
};

export const initializeSocket = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (!user || !user.verified) {
        return next(new Error('Invalid user'));
      }

      socket.userId = user._id;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join group rooms
    socket.on('join-group', (groupId: string) => {
      socket.join(`group:${groupId}`);
      console.log(`User ${socket.userId} joined group ${groupId}`);
    });

    // Leave group room
    socket.on('leave-group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
      console.log(`User ${socket.userId} left group ${groupId}`);
    });

    // Send message (real-time)
    socket.on('send-message', async (data: {
      to?: string;
      groupId?: string;
      body: string;
      type?: string;
    }) => {
      try {
        const message = await Message.create({
          from: socket.userId,
          to: data.to,
          groupId: data.groupId,
          type: data.type || 'text',
          body: data.body,
          readBy: [socket.userId]
        });

        await message.populate('from', 'email profile');

        if (data.groupId) {
          // Broadcast to group
          io.to(`group:${data.groupId}`).emit('new-message', message);
        } else if (data.to) {
          // Send to specific user
          io.to(`user:${data.to}`).emit('new-message', message);
          io.to(`user:${socket.userId}`).emit('new-message', message);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data: { to?: string; groupId?: string; isTyping: boolean }) => {
      const payload = {
        userId: socket.userId,
        isTyping: data.isTyping
      };

      if (data.groupId) {
        socket.to(`group:${data.groupId}`).emit('user-typing', payload);
      } else if (data.to) {
        io.to(`user:${data.to}`).emit('user-typing', payload);
      }
    });

    // Mark message as read
    socket.on('mark-read', async (messageId: string) => {
      try {
        const message = await Message.findById(messageId);
        if (message && !message.readBy.includes(socket.userId!)) {
          message.readBy.push(socket.userId!);
          await message.save();

          // Notify sender
          io.to(`user:${message.from}`).emit('message-read', {
            messageId,
            readBy: socket.userId
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};
