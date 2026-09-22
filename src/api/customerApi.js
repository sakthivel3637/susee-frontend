import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const customerApi = {
  getCustomers: async (params) => {
    return await axiosInstance.get(ENDPOINTS.CUSTOMERS.LIST, { params });
  },

  getCustomerDetail: async (id) => {
    return await axiosInstance.get(ENDPOINTS.CUSTOMERS.DETAIL(id));
  },

  updateCustomer: async (id, data) => {
    return await axiosInstance.put(ENDPOINTS.CUSTOMERS.UPDATE(id), data);
  },

  updateCustomerStatus: async (id, isActive) => {
    return await axiosInstance.patch(ENDPOINTS.CUSTOMERS.STATUS(id), { isActive });
  }
};
