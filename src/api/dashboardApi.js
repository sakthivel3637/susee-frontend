import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getDashboardStatsApi = () => axiosInstance.get(ENDPOINTS.DASHBOARD.STATS);
export const getAdminDashboardApi = () => axiosInstance.get(ENDPOINTS.DASHBOARD.ADMIN);
export const getManagerDashboardApi = (params) => axiosInstance.get(ENDPOINTS.DASHBOARD.MANAGER, { params });
export const getMDDashboardApi = (params) => axiosInstance.get(ENDPOINTS.DASHBOARD.MD, { params });
export const getSupervisorDashboardApi = () => axiosInstance.get(ENDPOINTS.DASHBOARD.SUPERVISOR);
export const getBodyShopDashboardApi = () => axiosInstance.get(ENDPOINTS.DASHBOARD.BODY_SHOP);
export const getWaterWashDashboardApi = () => axiosInstance.get(ENDPOINTS.DASHBOARD.WATER_WASH);
export const getRecentJobsApi = () => axiosInstance.get(ENDPOINTS.DASHBOARD.RECENT_JOBS);
export const getQueueSummaryApi = () => axiosInstance.get(ENDPOINTS.DASHBOARD.QUEUE_SUMMARY);
export const getTvKioskDashboardApi = (params) => axiosInstance.get(ENDPOINTS.KIOSK.TV, { params });
