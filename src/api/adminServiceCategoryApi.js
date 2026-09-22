import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getServiceCategoriesApi = async (params = {}) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.SERVICE_CATEGORIES.LIST, { params });
  return response;
};

export const getServiceCategoryApi = async (id) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.SERVICE_CATEGORIES.DETAIL(id));
  return response;
};

export const createServiceCategoryApi = async (data) => {
  const response = await axiosInstance.post(ENDPOINTS.ADMIN_MASTERS.SERVICE_CATEGORIES.CREATE, data);
  return response;
};

export const updateServiceCategoryApi = async (id, data) => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_MASTERS.SERVICE_CATEGORIES.UPDATE(id), data);
  return response;
};

export const updateServiceCategoryStatusApi = async (id, data) => {
  const response = await axiosInstance.patch(ENDPOINTS.ADMIN_MASTERS.SERVICE_CATEGORIES.STATUS(id), data);
  return response;
};
