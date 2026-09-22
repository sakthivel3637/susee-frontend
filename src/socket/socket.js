import { io } from 'socket.io-client';
import { API_BASE } from '../api/endpoints';

export const socket = io(API_BASE, {
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
