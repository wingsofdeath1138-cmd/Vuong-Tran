import { io } from 'socket.io-client';

// Use relative connection to automatically use the current origin and port
const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
