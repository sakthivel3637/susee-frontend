import { io } from 'socket.io-client';
import { API_BASE } from '../api/endpoints';

// Socket.io must connect to the server ROOT (e.g. http://192.168.1.124:5000)
// NOT to the API path (e.g. http://192.168.1.124:5000/api).
// Strip trailing /api or /api/ from the URL.
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');

// Use a window-level global to survive Vite HMR reloads.
if (!window.__dvdsos_socket) {
  window.__dvdsos_socket = io(SOCKET_URL, {
    autoConnect: true,
    withCredentials: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
}

export const socket = window.__dvdsos_socket;

// No-op — socket manages its own connection as a singleton
export const connectSocket = () => {};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

