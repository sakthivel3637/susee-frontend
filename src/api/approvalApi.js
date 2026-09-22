import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getApprovalsApi = (params) => axiosInstance.get(ENDPOINTS.APPROVALS.LIST, { params });
export const getPendingApprovalsApi = () => axiosInstance.get(ENDPOINTS.APPROVALS.PENDING);
export const approveRequestApi = (id, data) => axiosInstance.post(ENDPOINTS.APPROVALS.APPROVE(id), data);
export const rejectRequestApi = (id, data) => axiosInstance.post(ENDPOINTS.APPROVALS.REJECT(id), data);
export const getApprovalDetailApi = (id) => axiosInstance.get(ENDPOINTS.APPROVALS.DETAIL(id));
