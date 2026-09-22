import { useQuery } from '@tanstack/react-query';
import { getVehiclesApi, getVehicleApi, getVehicleHistoryApi, searchVehiclesApi } from '../api/vehicleApi';
import { getJobCardsApi, getJobCardApi, getJobCardStatusesApi } from '../api/jobCardApi';
import { getApprovalsApi } from '../api/approvalApi';
import { getUsersApi } from '../api/userApi';
import { getServicesApi, getBrandsApi, getModelsApi, getPricingApi, getBrandDropdownApi } from '../api/masterApi';
import { customerApi } from '../api/customerApi';
import { getMDDashboardApi } from '../api/dashboardApi';


export const useVehicles = (params = {}) => {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: async () => {
      return await getVehiclesApi(params);
    },
    staleTime: 30000,
  });
};

export const useVehicle = (id) => {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const res = await getVehicleApi(id);
      return res?.data || res;
    },
    enabled: !!id,
  });
};

export const useVehicleHistory = (id) => {
  return useQuery({
    queryKey: ['vehicles', id, 'history'],
    queryFn: async () => {
      const res = await getVehicleHistoryApi(id); 
      return res?.data || res;
    },
    enabled: !!id,
  });
};


export const useJobCards = (params = {}) => {
  return useQuery({
    queryKey: ['job-cards', params],
    queryFn: async () => {
      return await getJobCardsApi(params);
    },
    staleTime: 30000,
  });
};

export const useJobCard = (id) => {
  return useQuery({
    queryKey: ['job-cards', id],
    queryFn: async () => {
      const res = await getJobCardApi(id);
      return res?.data || res;
    },
    enabled: !!id,
  });
};

export const useJobCardStatuses = () => {
  return useQuery({
    queryKey: ['job-cards-statuses'],
    queryFn: async () => {
      const res = await getJobCardStatusesApi();
      return res?.data || [];
    },
    staleTime: 300000,
  });
};


export const useApprovals = (params = {}) => {
  return useQuery({
    queryKey: ['approvals', params],
    queryFn: async () => {
      return await getApprovalsApi(params);
    },
    staleTime: 20000,
    refetchInterval: 30000,
  });
};


export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      return await getUsersApi(params);
    },
    staleTime: 60000,
  });
};


export const useCustomers = (params = {}) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerApi.getCustomers(params),
    staleTime: 60000,
  });
};

export const useCustomerDetails = (id) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customerApi.getCustomerDetail(id),
    enabled: !!id,
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ['masters', 'services'],
    queryFn: async () => {
      return await getServicesApi();
    },
    staleTime: 300000,
  });
};

export const useBrands = () => {
  return useQuery({
    queryKey: ['masters', 'brands'],
    queryFn: async () => {
      return await getBrandsApi();
    },
    staleTime: 300000,
  });
};

export const useBrandDropdown = () => {
  return useQuery({
    queryKey: ['masters', 'brandDropdown'],
    queryFn: async () => {
      const res = await getBrandDropdownApi();
      return res?.data || res;
    },
    staleTime: 300000,
  });
};

export const useModels = (brandId) => {
  return useQuery({
    queryKey: ['masters', 'models', brandId],
    queryFn: async () => {
      return await getModelsApi(brandId);
    },
    staleTime: 300000,
  });
};

export const usePricing = () => {
  return useQuery({
    queryKey: ['masters', 'pricing'],
    queryFn: async () => {
      return await getPricingApi();
    },
    staleTime: 300000,
  });
};

export const useMdDashboard = (params) => {
  return useQuery({
    queryKey: ['dashboard', 'md', params],
    queryFn: async () => {
      const res = await getMDDashboardApi(params);
      return res?.data || res;
    },
    staleTime: 30000,
  });
};
