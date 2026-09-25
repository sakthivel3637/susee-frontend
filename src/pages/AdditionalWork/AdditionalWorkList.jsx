import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Card, Typography, Select, MenuItem, Tooltip } from '@mui/material';
import { Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { ROUTES } from '../../config/routes';
import { getAdditionalWorkRequestsApi } from '../../api/jobCardApi';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { usePermissions } from '../../hooks/usePermissions';
import DataTable from '../../components/common/DataTable';
import VehicleNumberPlate from '../../components/common/VehicleNumberPlate';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import { useDebounce } from '../../hooks/useDebounce';
import JobCardDetailModal from '../../components/common/JobCardDetailModal';

const normalizePayload = (payload) => payload?.data || payload || {};

const getStatusCode = (request) => String(request?.statusCode || request?.status?.code || '').toUpperCase();

const getServiceNames = (request) => {
  const services = Array.isArray(request?.services) ? request.services : [];
  return services.map((service) => service.serviceName || service.name).filter(Boolean).join(', ');
};

export function AdditionalWorkRequestListScreen({
  title = 'Additional Work Requests',
  category = '',
  createRoute = ROUTES.FLOOR_ADDITIONAL_WORK_NEW,
  permissionPath = '/additional-work'
}) {
  const navigate = useNavigate();
  const { canCreate } = usePermissions();
  const canCreateAdditionalWork = canCreate(permissionPath);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const debouncedSearch = useDebounce(search, 300);
  const [detailModal, setDetailModal] = useState({ isOpen: false, jobCardId: null });

  const { data: payload, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['additional-work-requests', category, debouncedSearch, statusFilter, page, rowsPerPage],
    queryFn: () => getAdditionalWorkRequestsApi({
      ...(category ? { category } : {}),
      search: debouncedSearch,
      status: statusFilter,
      page: page + 1,
      limit: rowsPerPage
    }),
    staleTime: 20000
  });

  const data = normalizePayload(payload);
  const requests = useMemo(() => {
    return Array.isArray(data?.requests) ? data.requests : (Array.isArray(data) ? data : []);
  }, [data]);

  const totalCount = data?.meta?.total || data?.total || requests.length;

  const columns = [
    {
      header: 'Approval ID',
      accessor: 'approvalId',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
          {row.approvalCode || row.approvalId}
        </Typography>
      ),
    },
    {
      header: 'Job Card',
      accessor: 'jobCardNo',
      render: (row) => (
        <Typography variant="body2">
          {row.jobCardNo || `Job Card ${row.jobCardId}`}
        </Typography>
      ),
    },
    {
      header: 'Vehicle',
      render: (row) => (
        <VehicleNumberPlate vehicleNumber={row.vehicleNumber || 'Unknown'} />
      ),
    },
    { header: 'Customer', render: (row) => row.customerName || 'N/A' },
    {
      header: 'Services',
      render: (row) => {
        const parentService = row.linkedServiceLabel || 'Original service';
        const addServices = getServiceNames(row) || 'Additional work';
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tooltip title={addServices} placement="bottom">
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{
                  display: '-webkit-box',
                  overflow: 'hidden',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 1,
                  wordBreak: 'break-word',
                  maxWidth: '200px'
                }}
              >
                {addServices}
              </Typography>
            </Tooltip>
          </Box>
        );
      },
    },
    { header: 'Amount', render: (row) => <Typography variant="body2" fontWeight={600}>{formatCurrency(row.totalAmount || 0)}</Typography> },
    { header: 'Requested At', render: (row) => <Typography variant="body2">{formatDateTime(row.requestedAt)}</Typography> },
    { header: 'Status', render: (row) => <StatusBadge status={getStatusCode(row)} /> },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: 'Additional Work' }]}
      />


      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search vehicle, job ID..."
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
          />
        </Box>
        <Select
          size="small"
          displayEmpty
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{
            width: { xs: '100%', sm: 200 },
            bgcolor: 'background.paper',
            borderRadius: '24px',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '1px' },
          }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="PENDING">Pending Approval</MenuItem>
          <MenuItem value="APPROVED">Approved</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
        </Select>
      </Box>

      <Card sx={{ borderRadius: 0 }}>
        <DataTable
          columns={columns}
          data={requests}
          loading={isLoading || isFetching}
          emptyMessage="No additional work requests found."
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowDoubleClick={(row) => {
            const jobCardId = row.jobCardId || row.id || row.jobCardNo;
            if (jobCardId) {
              setDetailModal({ isOpen: true, jobCardId, approvalData: row });
            }
          }}
        />
      </Card>

      <JobCardDetailModal
        isOpen={detailModal.isOpen}
        jobCardId={detailModal.jobCardId}
        approvalData={detailModal.approvalData}
        onClose={() => setDetailModal({ isOpen: false, jobCardId: null, approvalData: null })}
      />
    </Box>
  );
}

export default function AdditionalWorkList() {
  return <AdditionalWorkRequestListScreen />;
}
