import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getNotificationsApi = (params) => axiosInstance.get(ENDPOINTS.NOTIFICATIONS.LIST, { params });
export const getUnreadNotificationCountApi = () => axiosInstance.get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
export const markNotificationReadApi = (id) => axiosInstance.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
export const markAllNotificationsReadApi = () => axiosInstance.patch(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
export const registerDeviceTokenApi = (token, platform = 'WEB', deviceId = null) => (
  axiosInstance.post(ENDPOINTS.DEVICE_TOKEN.REGISTER, { token, platform, deviceId })
);
export const removeDeviceTokenApi = (token) => axiosInstance.put(ENDPOINTS.DEVICE_TOKEN.REMOVE, { token });
