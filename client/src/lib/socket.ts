import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGroup(groupId: string) {
    this.socket?.emit('join-group', groupId);
  }

  leaveGroup(groupId: string) {
    this.socket?.emit('leave-group', groupId);
  }

  sendMessage(data: {
    to?: string;
    groupId?: string;
    body: string;
    type?: string;
  }) {
    this.socket?.emit('send-message', data);
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new-message', callback);
    return () => {
      this.socket?.off('new-message', callback);
    };
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('user-typing', callback);
    return () => {
      this.socket?.off('user-typing', callback);
    };
  }

  emitTyping(data: { to?: string; groupId?: string; isTyping: boolean }) {
    this.socket?.emit('typing', data);
  }

  markAsRead(messageId: string) {
    this.socket?.emit('mark-read', messageId);
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
