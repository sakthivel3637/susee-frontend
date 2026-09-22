import api from './axiosInstance';

export const getModulesApi = async (params = {}) => {
  return await api.get('/admin/modules/list', { params });
};

export const getModuleDetailApi = async (id) => {
  return await api.get(`/admin/modules/detail/${id}`);
};

export const createModuleApi = async (data) => {
  return await api.post('/admin/modules/create', data);
};

export const updateModuleApi = async (id, data) => {
  return await api.put(`/admin/modules/update/${id}`, data);
};

export const updateModuleStatusApi = async (id, isActive) => {
  return await api.patch(`/admin/modules/status/${id}`, { isActive });
};

