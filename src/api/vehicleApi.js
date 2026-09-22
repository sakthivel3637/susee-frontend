import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getVehiclesApi = (params) => axiosInstance.get(ENDPOINTS.VEHICLES.LIST, { params });
export const getVehicleApi = (id) => axiosInstance.get(ENDPOINTS.VEHICLES.DETAIL(id));
export const createVehicleApi = (data) => axiosInstance.post(ENDPOINTS.VEHICLES.CREATE, data);
export const updateVehicleApi = (id, data) => axiosInstance.put(ENDPOINTS.VEHICLES.UPDATE(id), data);
export const deleteVehicleApi = (id) => axiosInstance.delete(ENDPOINTS.VEHICLES.DELETE(id));
export const getVehicleHistoryApi = (id) => axiosInstance.get(ENDPOINTS.VEHICLES.HISTORY(id));
export const searchVehiclesApi = (query) => axiosInstance.get(ENDPOINTS.VEHICLES.SEARCH, { params: { q: query } });
export const exportVehiclesExcelApi = (params) => axiosInstance.get(ENDPOINTS.VEHICLES.LIST, {
  params: { ...params, export: 'true' },
  responseType: 'blob'
});
