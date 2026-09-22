import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getStatesApi = (params) => axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.STATES.LIST, { params });
export const getStateDetailApi = (id) => axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.STATES.DETAIL(id));
export const createStateApi = (data) => axiosInstance.post(ENDPOINTS.ADMIN_MASTERS.STATES.CREATE, data);
export const updateStateApi = (id, data) => axiosInstance.put(ENDPOINTS.ADMIN_MASTERS.STATES.UPDATE(id), data);
export const updateStateStatusApi = (id, data) => axiosInstance.patch(ENDPOINTS.ADMIN_MASTERS.STATES.STATUS(id), data);
