import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getRolesApi = (params) => axiosInstance.get(ENDPOINTS.ROLES.LIST, { params });
export const getRoleDetailApi = (id) => axiosInstance.get(ENDPOINTS.ROLES.DETAIL(id));
export const createRoleApi = (data) => axiosInstance.post(ENDPOINTS.ROLES.CREATE, data);
export const updateRoleApi = (id, data) => axiosInstance.put(ENDPOINTS.ROLES.UPDATE(id), data);
export const updateRoleStatusApi = (id, data) => axiosInstance.patch(ENDPOINTS.ROLES.STATUS(id), data);

export const getRoleMenuPermissionsApi = (roleId) => axiosInstance.get(ENDPOINTS.ROLES.MENU_PERMISSIONS.LIST(roleId));
export const saveRoleMenuPermissionsApi = (roleId, data) => axiosInstance.post(ENDPOINTS.ROLES.MENU_PERMISSIONS.SAVE(roleId), data);
export const updateRoleMenuPermissionsApi = (roleId, data) => axiosInstance.put(ENDPOINTS.ROLES.MENU_PERMISSIONS.UPDATE(roleId), data);