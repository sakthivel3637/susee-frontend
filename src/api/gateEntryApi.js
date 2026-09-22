import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const gateEntryApi = {
  list: async (params) => {
    return await axiosInstance.get(ENDPOINTS.GATE_ENTRY.LIST, { params });
  },
  create: async (data) => {
    return await axiosInstance.post(ENDPOINTS.GATE_ENTRY.CREATE, data);
  },
  detail: async (id) => {
    return await axiosInstance.get(ENDPOINTS.GATE_ENTRY.DETAIL(id));
  },
  getBySlug: async (slug) => {
    return await axiosInstance.get(`/gate-entries/view/${slug}`);
  },
  update: async (id, data) => {
    return await axiosInstance.put(ENDPOINTS.GATE_ENTRY.UPDATE(id), data);
  },
  exportExcel: async (params) => {
    return await axiosInstance.get(ENDPOINTS.GATE_ENTRY.LIST, {
      params: { ...params, export: 'true' },
      responseType: 'blob'
    });
  }
};
