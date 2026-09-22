import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getAuditLogsApi = async (params = {}) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.AUDIT_LOGS.LIST, { params });
  return response;
};

export const exportAuditLogsExcelApi = (params) => axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.AUDIT_LOGS.LIST, {
  params: { ...params, export: 'true' },
  responseType: 'blob'
});

export const getAuditLogDetailApi = async (id) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.AUDIT_LOGS.DETAIL(id));
  return response;
};
