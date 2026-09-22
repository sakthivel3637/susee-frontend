import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getUsersApi = (params) => axiosInstance.get(ENDPOINTS.USERS.LIST, { params });
export const getMechanicsDropdownApi = (params) => axiosInstance.get(ENDPOINTS.USERS.MECHANICS_DROPDOWN, { params });
export const getUserApi = (id) => axiosInstance.get(ENDPOINTS.USERS.DETAIL(id));
export const createUserApi = (data) => axiosInstance.post(ENDPOINTS.USERS.CREATE, data);
export const updateUserApi = (id, data) => axiosInstance.put(ENDPOINTS.USERS.UPDATE(id), data);
export const deleteUserApi = (id) => axiosInstance.delete(ENDPOINTS.USERS.DELETE(id));
export const changePasswordApi = (data) => axiosInstance.post(ENDPOINTS.USERS.CHANGE_PASSWORD, data);
export const updateUserStatusApi = (id, data) => axiosInstance.patch(`/users/status/${id}`, data);
export const exportUsersExcelApi = (params) => axiosInstance.get(ENDPOINTS.USERS.LIST, {
  params: { ...params, export: 'true' },
  responseType: 'blob'
});
