import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getDailyReportApi = (params) => axiosInstance.get(ENDPOINTS.REPORTS.DAILY, { params });
export const getWeeklyReportApi = (params) => axiosInstance.get(ENDPOINTS.REPORTS.WEEKLY, { params });
export const getMonthlyReportApi = (params) => axiosInstance.get(ENDPOINTS.REPORTS.MONTHLY, { params });
export const getCustomReportApi = (params) => axiosInstance.get(ENDPOINTS.REPORTS.CUSTOM, { params });
export const exportReportApi = (params) => axiosInstance.get(ENDPOINTS.REPORTS.EXPORT, { params, responseType: 'blob' });
