import axios from 'axios';
import { API_BASE } from './endpoints';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    let message =
      error?.response?.data?.message || error?.message || 'Something went wrong';

    if (error.code === 'ECONNABORTED' || message.toLowerCase().includes('timeout')) {
      message = 'The server is taking too long to respond. Please try again.';
    } else if (message.toLowerCase().includes('network error')) {
      message = 'Failed to connect to the server. Please check your internet connection.';
    }

    if (status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject({ 
      status, 
      message, 
      data: error?.response?.data,
      response: { data: { message } }
    });
  }
);

export default axiosInstance;
