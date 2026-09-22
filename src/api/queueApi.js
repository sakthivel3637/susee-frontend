import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getMechanicalQueueApi = (params) => axiosInstance.get(ENDPOINTS.QUEUES.MECHANICAL, { params });
export const getBodyShopQueueApi = (params) => axiosInstance.get(ENDPOINTS.QUEUES.BODY_SHOP, { params });
export const getWaterWashQueueApi = (params) => axiosInstance.get(ENDPOINTS.QUEUES.WATER_WASH, { params });
export const assignQueueWorkApi = (jobCardId, data) => axiosInstance.post(ENDPOINTS.QUEUES.ASSIGN(jobCardId), data);
export const reassignQueueWorkApi = (jobCardId, data) => axiosInstance.put(ENDPOINTS.QUEUES.REASSIGN(jobCardId), data);
export const updateQueueAssignmentStatusApi = (assignmentId, data) => axiosInstance.patch(ENDPOINTS.QUEUES.UPDATE_STATUS(assignmentId), data);
