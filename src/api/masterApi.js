import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

// Services
export const getServicesApi = () => axiosInstance.get(ENDPOINTS.MASTERS.SERVICES);
export const createServiceApi = (data) => axiosInstance.post(ENDPOINTS.MASTERS.SERVICE_CREATE, data);
export const updateServiceApi = (id, data) => axiosInstance.put(ENDPOINTS.MASTERS.SERVICE_UPDATE(id), data);
export const deleteServiceApi = (id) => axiosInstance.delete(ENDPOINTS.MASTERS.SERVICE_DELETE(id));

// Brands
export const getBrandsApi = () => axiosInstance.get(ENDPOINTS.MASTERS.BRANDS);
export const getBrandDropdownApi = () => axiosInstance.get(ENDPOINTS.MASTERS.BRAND_DROPDOWN);
export const createBrandApi = (data) => axiosInstance.post(ENDPOINTS.MASTERS.BRAND_CREATE, data);
export const updateBrandApi = (id, data) => axiosInstance.put(ENDPOINTS.MASTERS.BRAND_UPDATE(id), data);
export const deleteBrandApi = (id) => axiosInstance.delete(ENDPOINTS.MASTERS.BRAND_DELETE(id));

// Models
export const getModelsApi = (brandId) => axiosInstance.get(ENDPOINTS.MASTERS.MODELS, { params: { brandId } });
export const createModelApi = (data) => axiosInstance.post(ENDPOINTS.MASTERS.MODEL_CREATE, data);
export const updateModelApi = (id, data) => axiosInstance.put(ENDPOINTS.MASTERS.MODEL_UPDATE(id), data);
export const deleteModelApi = (id) => axiosInstance.delete(ENDPOINTS.MASTERS.MODEL_DELETE(id));

// Pricing
export const getPricingApi = () => axiosInstance.get(ENDPOINTS.MASTERS.PRICING);
export const createPricingApi = (data) => axiosInstance.post(ENDPOINTS.MASTERS.PRICING_CREATE, data);
export const updatePricingApi = (id, data) => axiosInstance.put(ENDPOINTS.MASTERS.PRICING_UPDATE(id), data);
export const deletePricingApi = (id) => axiosInstance.delete(ENDPOINTS.MASTERS.PRICING_DELETE(id));
