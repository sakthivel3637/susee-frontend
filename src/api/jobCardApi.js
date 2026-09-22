import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const getJobCardsApi = (params) => axiosInstance.get(ENDPOINTS.JOB_CARDS.LIST, { params });
export const exportJobCardsExcelApi = (params) => axiosInstance.get(ENDPOINTS.JOB_CARDS.LIST, {
  params: { ...params, export: 'true' },
  responseType: 'blob'
});
export const getJobCardApi = (id) => axiosInstance.get(ENDPOINTS.JOB_CARDS.DETAIL(id));
export const getJobCardStatusesApi = () => axiosInstance.get(ENDPOINTS.JOB_CARDS.STATUSES);
export const getJobCardServiceStatusesApi = () => axiosInstance.get(ENDPOINTS.JOB_CARDS.SERVICE_STATUSES);
export const getAdditionalWorkRequestsApi = (params) => axiosInstance.get(ENDPOINTS.JOB_CARDS.ADDITIONAL_WORK_LIST, { params });
export const getAdditionalWorkContextApi = (id, params) => axiosInstance.get(ENDPOINTS.JOB_CARDS.ADDITIONAL_WORK_CONTEXT(id), { params });
export const createAdditionalWorkRequestApi = (id, data) => axiosInstance.post(ENDPOINTS.JOB_CARDS.ADDITIONAL_WORK_REQUEST(id), data);
export const createJobCardApi = (data) => axiosInstance.post(ENDPOINTS.JOB_CARDS.CREATE, data);
export const updateJobCardApi = (id, data) => axiosInstance.put(ENDPOINTS.JOB_CARDS.UPDATE(id), data);
export const deleteJobCardApi = (id) => axiosInstance.delete(ENDPOINTS.JOB_CARDS.DELETE(id));
export const postponeJobCardServiceApi = (id, serviceId, data) => axiosInstance.post(ENDPOINTS.JOB_CARDS.POSTPONE(id, serviceId), data);
export const resumeJobCardServiceApi = (id, serviceId, data) => axiosInstance.post(ENDPOINTS.JOB_CARDS.RESUME(id, serviceId), data);
export const skipJobCardDepartmentApi = (id, department, data) => axiosInstance.post(ENDPOINTS.JOB_CARDS.SKIP_DEPARTMENT(id, department), data);
