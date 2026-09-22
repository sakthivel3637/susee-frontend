import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getMenusApi = (params) => axiosInstance.get(ENDPOINTS.MENUS.LIST, { params });
export const getMenuModulesApi = () => axiosInstance.get(ENDPOINTS.MENUS.MODULES);
export const getMenusByModuleApi = (module) => axiosInstance.get(ENDPOINTS.MENUS.BY_MODULE(module));
