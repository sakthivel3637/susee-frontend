import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardApi, getManagerDashboardApi, getMDDashboardApi, getSupervisorDashboardApi, getQueueSummaryApi, getTvKioskDashboardApi } from '../api/dashboardApi';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const response = await getAdminDashboardApi();
      return response;
    },
    staleTime: 60000,
  });
};

export const useManagerDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: async () => {
      return await getManagerDashboardApi();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

export const useMDDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'md'],
    queryFn: async () => {
      return await getMDDashboardApi();
    },
    staleTime: 60000,
  });
};

export const useSupervisorDashboard = () => {
  return useQuery({
    queryKey: ['dashboard', 'supervisor'],
    queryFn: async () => {
      return await getSupervisorDashboardApi();
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
};

export const useQueueSummary = () => {
  return useQuery({
    queryKey: ['dashboard', 'queue-summary'],
    queryFn: async () => {
      return await getQueueSummaryApi();
    },
    staleTime: 15000,
    refetchInterval: 30000,
  });
};

export const useTvKioskDashboard = (params) => {
  return useQuery({
    queryKey: ['dashboard', 'tv-kiosk', params],
    queryFn: async () => {
      const response = await getTvKioskDashboardApi(params);
      return response.data || response;
    },
    staleTime: 0,
    retry: false,
  });
};
