import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getServiceCentersApi = (params) => axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.SERVICE_CENTERS.LIST, { params });
export const getServiceCenterApi = (id) => axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.SERVICE_CENTERS.DETAIL(id));
export const createServiceCenterApi = (data) => axiosInstance.post(ENDPOINTS.ADMIN_MASTERS.SERVICE_CENTERS.CREATE, data);
export const updateServiceCenterApi = (id, data) => axiosInstance.put(ENDPOINTS.ADMIN_MASTERS.SERVICE_CENTERS.UPDATE(id), data);
export const updateServiceCenterStatusApi = (id, data) => axiosInstance.patch(ENDPOINTS.ADMIN_MASTERS.SERVICE_CENTERS.STATUS(id), data);
