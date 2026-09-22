import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const adminBayApi = {
  getBays: async (params) => {
    return await axiosInstance.get(ENDPOINTS.MASTERS.BAYS.LIST, { params });
  },

  getBayDropdown: async (params) => {
    return await axiosInstance.get(ENDPOINTS.MASTERS.BAYS.CRM_DROPDOWN, { params });
  },

  createBay: async (data) => {
    return await axiosInstance.post(ENDPOINTS.MASTERS.BAYS.CREATE, data);
  },

  updateBay: async (id, data) => {
    return await axiosInstance.put(ENDPOINTS.MASTERS.BAYS.UPDATE(id), data);
  },

  updateBayStatus: async (id, isActive) => {
    return await axiosInstance.patch(ENDPOINTS.MASTERS.BAYS.STATUS(id), { isActive });
  }
};
