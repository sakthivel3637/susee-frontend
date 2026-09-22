import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getDistrictsApi = (params) => axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.DISTRICTS.LIST, { params });
export const getDistrictDetailApi = (id) => axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.DISTRICTS.DETAIL(id));
export const createDistrictApi = (data) => axiosInstance.post(ENDPOINTS.ADMIN_MASTERS.DISTRICTS.CREATE, data);
export const updateDistrictApi = (id, data) => axiosInstance.put(ENDPOINTS.ADMIN_MASTERS.DISTRICTS.UPDATE(id), data);
export const updateDistrictStatusApi = (id, data) => axiosInstance.patch(ENDPOINTS.ADMIN_MASTERS.DISTRICTS.STATUS(id), data);
