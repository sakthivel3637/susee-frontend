import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export const loginApi = (data) => axiosInstance.post(ENDPOINTS.AUTH.LOGIN, data, {
  headers: {
    'x-client-platform': 'web'
  }
});
export const logoutApi = () => axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
export const getMeApi = () => axiosInstance.get(ENDPOINTS.AUTH.ME);
export const forgotPasswordApi = (data) => axiosInstance.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
export const resetPasswordApi = (data) => axiosInstance.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
export const updateProfileApi = (data) => axiosInstance.put(ENDPOINTS.AUTH.UPDATE_PROFILE, data);
