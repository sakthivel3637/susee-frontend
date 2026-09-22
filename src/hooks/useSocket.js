import { useEffect, useCallback } from 'react';
import { socket, connectSocket, disconnectSocket } from '../socket/socket';
import useAuthStore from '../store/useAuthStore';

const SOCKET_EVENTS = {
  VEHICLE_CREATED: 'vehicle-created',
  VEHICLE_UPDATED: 'vehicle-updated',
  VEHICLE_STATUS_UPDATED: 'vehicle-status-updated',
  JOBCARD_CREATED: 'jobcard-created',
  APPROVAL_RECEIVED: 'approval-received',
  APPROVAL_APPROVED: 'approval-approved',
  APPROVAL_REJECTED: 'approval-rejected',
  NOTIFICATION_CREATED: 'notification-created',
};

/**
 * useSocket — connect/disconnect socket, subscribe to events
 * @param {Object} handlers — { eventName: callback }
 */
export const useSocket = (handlers = {}) => {
  const { isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated) return;
    connectSocket();
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      disconnectSocket();
    };
  }, [isAuthenticated]);

  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);

  return { socket, emit, SOCKET_EVENTS };
};

export { SOCKET_EVENTS };
