import api from './axiosInstance';

export const getStatusesApi = async (params = {}) => {
  return await api.get('/admin/statuses/list', { params });
};

export const getStatusDetailApi = async (id) => {
  return await api.get(`/admin/statuses/detail/${id}`);
};

export const createStatusApi = async (data) => {
  return await api.post('/admin/statuses/create', data);
};

export const updateStatusApi = async (id, data) => {
  return await api.put(`/admin/statuses/update/${id}`, data);
};

export const updateStatusActiveApi = async (id, isActive) => {
  return await api.patch(`/admin/statuses/status/${id}`, { isActive });
};
