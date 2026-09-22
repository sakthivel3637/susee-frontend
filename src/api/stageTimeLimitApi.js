import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getStageTimeLimitsApi = (params = {}) => {
  return axiosInstance.get(ENDPOINTS.STAGE_TIME_LIMITS.LIST, { params });
};

export const getStageTimeLimitApi = (id) => {
  return axiosInstance.get(ENDPOINTS.STAGE_TIME_LIMITS.DETAIL(id));
};

export const createStageTimeLimitApi = (data) => {
  return axiosInstance.post(ENDPOINTS.STAGE_TIME_LIMITS.CREATE, data);
};

export const updateStageTimeLimitApi = (id, data) => {
  return axiosInstance.put(ENDPOINTS.STAGE_TIME_LIMITS.UPDATE(id), data);
};

export const updateStageTimeLimitStatusApi = (id, isActive) => {
  return axiosInstance.patch(ENDPOINTS.STAGE_TIME_LIMITS.STATUS(id), { isActive });
};

export const getStageModulesApi = () => {
  return axiosInstance.get(ENDPOINTS.STAGE_TIME_LIMITS.MODULES);
};

export const getStageStatusesApi = (moduleId) => {
  return axiosInstance.get(ENDPOINTS.STAGE_TIME_LIMITS.STATUSES, { params: { moduleId } });
};

export const getStageRolesApi = () => {
  return axiosInstance.get(ENDPOINTS.STAGE_TIME_LIMITS.ROLES);
};

export const getStageUsersApi = () => {
  return axiosInstance.get(ENDPOINTS.STAGE_TIME_LIMITS.USERS, { params: { isActive: true } });
};

export const getStageLocationsApi = () => {
  return axiosInstance.get(ENDPOINTS.STAGE_TIME_LIMITS.LOCATIONS);
};
