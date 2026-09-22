import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const adminBrandApi = {
  getBrands: (params) => {
    return axiosInstance.get(ENDPOINTS.ADMIN_MASTERS.BRANDS.LIST, { params });
  },
  
  createBrand: (data) => {
    return axiosInstance.post(ENDPOINTS.ADMIN_MASTERS.BRANDS.CREATE, data);
  },
  
  updateBrand: (id, data) => {
    return axiosInstance.put(ENDPOINTS.ADMIN_MASTERS.BRANDS.UPDATE(id), data);
  },
  
  updateBrandStatus: (id, isActive) => {
    return axiosInstance.patch(ENDPOINTS.ADMIN_MASTERS.BRANDS.STATUS(id), { isActive });
  }
};
