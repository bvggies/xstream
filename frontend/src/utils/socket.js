import { io } from 'socket.io-client';

// Get socket URL from environment variable (remove /api if present)
let SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
if (SOCKET_URL.endsWith('/api')) {
  SOCKET_URL = SOCKET_URL.replace('/api', '');
}
SOCKET_URL = SOCKET_URL.replace(/\/$/, '');

let socket = null;

export const initSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    withCredentials: true, // Important: send cookies
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

