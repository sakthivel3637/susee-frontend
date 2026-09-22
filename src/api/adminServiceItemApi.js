import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getServiceItemsApi = async (params = {}) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.SERVICE_ITEMS.LIST, { params });
  return response;
};

export const getServiceItemApi = async (id) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.SERVICE_ITEMS.DETAIL(id));
  return response;
};

export const createServiceItemApi = async (data) => {
  const response = await axiosInstance.post(ENDPOINTS.ADMIN_MASTERS.SERVICE_ITEMS.CREATE, data);
  return response;
};

export const updateServiceItemApi = async (id, data) => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_MASTERS.SERVICE_ITEMS.UPDATE(id), data);
  return response;
};

export const updateServiceItemStatusApi = async (id, data) => {
  const response = await axiosInstance.patch(ENDPOINTS.ADMIN_MASTERS.SERVICE_ITEMS.STATUS(id), data);
  return response;
};
