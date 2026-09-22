import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getLocationsApi = async (params = {}) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.LOCATIONS.LIST, { params });
  return response;
};

export const getLocationApi = async (id) => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.LOCATIONS.DETAIL(id));
  return response;
};

export const createLocationApi = async (data) => {
  const response = await axiosInstance.post(ENDPOINTS.ADMIN_MASTERS.LOCATIONS.CREATE, data);
  return response;
};

export const updateLocationApi = async (id, data) => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_MASTERS.LOCATIONS.UPDATE(id), data);
  return response;
};

export const updateLocationStatusApi = async (id, data) => {
  const response = await axiosInstance.patch(ENDPOINTS.ADMIN_MASTERS.LOCATIONS.STATUS(id), data);
  return response;
};
