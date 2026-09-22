import { useQuery } from '@tanstack/react-query';
import { getAuditLogsApi, getAuditLogDetailApi } from '../api/auditLogApi';

export const useAuditLogs = (params = {}) => {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: async () => {
      const res = await getAuditLogsApi(params);
      return res;
    },
    staleTime: 30000,
  });
};

export const useAuditLogDetail = (id) => {
  return useQuery({
    queryKey: ['auditLogs', id],
    queryFn: async () => {
      const res = await getAuditLogDetailApi(id);
      return res;
    },
    enabled: !!id,
  });
};
