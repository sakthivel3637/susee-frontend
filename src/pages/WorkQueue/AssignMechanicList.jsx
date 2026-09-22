import { useState, useEffect } from 'react';
import { User, Printer, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Card, Chip, TextField } from '@mui/material';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import JobCardDetailModal from '../../components/common/JobCardDetailModal';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastInfo, toastError } from '../../notifications/toast';
import { formatDateTime, formatWaitTime } from '../../utils/formatters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import { getMechanicalQueueApi, getBodyShopQueueApi, getWaterWashQueueApi, assignQueueWorkApi } from '../../api/queueApi';
import { skipJobCardDepartmentApi } from '../../api/jobCardApi';
import { getMechanicsDropdownApi } from '../../api/userApi';
import { adminBayApi } from '../../api/adminBayApi';
import { getDepartmentFromModules } from '../../utils/authAccess';
import { usePermissions } from '../../hooks/usePermissions';



const PRIORITY_COLORS = { LOW: '#10B981', NORMAL: '#3B82F6', HIGH: '#F59E0B', URGENT: '#EF4444' };
const BAY_TYPE_BY_CATEGORY = {
  mechanical: 'Mechanical',
  'body-shop': 'Body Shop',
  'water-wash': 'Water Wash'
};

export default function AssignMechanicList() {
  const queryClient = useQueryClient();
  const { role, user, menus } = useAuthStore();
  const locationId = user?.locationId || user?.location_id || user?.branchId || '';
  const queueCategory = getDepartmentFromModules(menus) || 'mechanical';
  const isBodyShop = queueCategory === 'body-shop';
  const isWaterWash = queueCategory === 'water-wash';
  const assigneeLabel = isBodyShop ? 'Technician' : isWaterWash ? 'Member' : 'Mechanic';
  const pageTitle = isBodyShop ? 'Assign Technician (Body Shop)' : isWaterWash ? 'Assign Water Wash Member' : 'Assign Mechanic';
  const { canUpdate } = usePermissions();
  const canAssignWork = canUpdate('/job-cards');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const { data: jobsResponse, isLoading } = useQuery({
    queryKey: ['assign-mechanic-queue', role, locationId, page, rowsPerPage, search],
    queryFn: async () => {
      const params = { locationId, page: page + 1, limit: rowsPerPage, search };
      if (queueCategory === 'body-shop') {
        return getBodyShopQueueApi(params);
      } else if (queueCategory === 'water-wash') {
        return getWaterWashQueueApi(params);
      } else {
        return getMechanicalQueueApi(params);
      }
    },
    enabled: !!role
  });

  const { data: mechanicsResponse, isLoading: isMechanicsLoading } = useQuery({
    queryKey: ['mechanics-dropdown', role, locationId],
    queryFn: () => getMechanicsDropdownApi({ locationId, category: queueCategory }),
    enabled: !!role,
    staleTime: 60000
  });

  const { data: baysResponse, isLoading: isBaysLoading } = useQuery({
    queryKey: ['assignment-bays', role, locationId, queueCategory],
    queryFn: () => adminBayApi.getBayDropdown({
      locationId,
      bayType: BAY_TYPE_BY_CATEGORY[queueCategory]
    }),
    enabled: !!role,
    staleTime: 30000
  });

  const apiJobs = jobsResponse?.data?.data || jobsResponse?.data || [];
  const mechanics = mechanicsResponse?.data?.users || mechanicsResponse?.users || [];
  const bays = baysResponse?.data?.bays || baysResponse?.data?.data?.bays || baysResponse?.bays || [];

  const [localJobs, setLocalJobs] = useState([]);

  useEffect(() => {
    if (apiJobs) {
      setLocalJobs(apiJobs);
    }
  }, [apiJobs]);

  const [detailModal, setDetailModal] = useState({ isOpen: false, jobCardId: null, item: null });
  const [skipModal, setSkipModal] = useState({ isOpen: false, item: null });
  const [skipReason, setSkipReason] = useState('');

  const skipMutation = useMutation({
    mutationFn: ({ jobCardId, payload }) => skipJobCardDepartmentApi(jobCardId, queueCategory, payload),
    onSuccess: async () => {
      toastSuccess('Department skipped successfully');
      setSkipModal({ isOpen: false, item: null });
      setSkipReason('');
      await queryClient.invalidateQueries({ queryKey: ['assign-mechanic-queue'] });
    },
    onError: (error) => toastError(error?.response?.data?.message || error?.message || 'Failed to skip department')
  });

  const [assignModal, setAssignModal] = useState({ isOpen: false, item: null });
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [selectedBay, setSelectedBay] = useState('');
  const selectedMechanicUser = mechanics.find((mechanic) => String(mechanic.id) === String(selectedMechanic));
  const selectedBayItem = bays.find((bay) => String(bay.id) === String(selectedBay));

  const assignMutation = useMutation({
    mutationFn: ({ jobCardId, payload }) => assignQueueWorkApi(jobCardId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assign-mechanic-queue'] });
      await queryClient.invalidateQueries({ queryKey: ['assignment-bays'] });
      setLocalJobs((currentJobs) => currentJobs.filter((job) => {
        const currentJobCardId = job.jobCardId || job.id;
        const assignedJobCardId = assignModal.item?.jobCardId || assignModal.item?.id;
        return String(currentJobCardId) !== String(assignedJobCardId);
      }));
      setAssignModal({ isOpen: false, item: null });

      toastSuccess(`Assigned to ${selectedMechanicUser?.fullName || assigneeLabel.toLowerCase()}${selectedBayItem ? ` in ${selectedBayItem.bayName || selectedBayItem.bayCode}` : ''}. Job Card sent to printer!`);


    },
    onError: (error) => {
      toastError(error?.message || `Failed to assign ${assigneeLabel.toLowerCase()}`);
    }
  });



  const filteredJobs = localJobs.filter(job =>
    (job?.vehicleNo || job?.vehicleNumber || '')?.toLowerCase().includes(search.toLowerCase()) ||
    (job?.customerName || job?.ownerName || '')?.toLowerCase().includes(search.toLowerCase()) ||
    (job?.jobCardNo || job?.id || '')?.toString().toLowerCase().includes(search.toLowerCase())
  );

  const handleAssignClick = (item) => {
    setAssignModal({ isOpen: true, item });
    setSelectedMechanic('');
    setSelectedBay('');
  };

  const columns = [
    {
      header: 'JOB CARD',
      render: (row) => (
        <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
          {row.jobCardNo || '—'}
        </Typography>
      ),
    },
    {
      header: 'VEHICLE NO.',
      render: (row) => (
        <Typography sx={{ color: '#3b82f6', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.875rem' }}>
          {row.vehicleNo || row.vehicleNumber || '—'}
        </Typography>
      ),
    },
    {
      header: 'CUSTOMER',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{row.customerName || row.ownerName || '—'}</Typography>
        </Box>
      ),
    },
    {
      header: 'SERVICES',
      render: (row) => (
        <Typography sx={{ fontSize: '0.875rem', color: '#374151' }}>
          {row.serviceNames?.length ? row.serviceNames.join(', ') : (row.serviceType || '—')}
        </Typography>
      ),
    },
    // {
    //   header: 'PRIORITY',
    //   render: (row) => (
    //     <Typography variant="caption" sx={{
    //       bgcolor: `${PRIORITY_COLORS[row.priority || 'NORMAL']}15`,
    //       color: PRIORITY_COLORS[row.priority || 'NORMAL'],
    //       px: 1.5, py: 0.5, borderRadius: 8, fontWeight: 700,
    //       border: '1px solid', borderColor: `${PRIORITY_COLORS[row.priority || 'NORMAL']}40`,
    //       textTransform: 'uppercase', letterSpacing: '0.5px'
    //     }}>
    //       {row.priority || 'NORMAL'}
    //     </Typography>
    //   ),
    // },
    {
      header: 'WAIT TIME',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Clock size={14} color="#6b7280" />
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
            {row.waitMinutes !== undefined ? formatWaitTime(row.waitMinutes) : (row.waitTime || '—')}
          </Typography>
        </Box>
      ),
    },
    {
      header: 'DELIVERY',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AlertTriangle size={14} color="#f59e0b" />
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
            {row.expectedDeliveryAt ? formatDateTime(row.expectedDeliveryAt) : (row.deliveryDate ? formatDateTime(row.deliveryDate) : '—')}
          </Typography>
        </Box>
      ),
    },
    ...(canAssignWork ? [{
      header: 'ACTION',
      render: (row) => {
        const canSkip = row.canSkip ?? (queueCategory !== 'water-wash');
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canSkip && (
              <Button
                variant="outlined"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSkipModal({ isOpen: true, item: row });
                  setSkipReason('');
                }}
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#f59e0b',
                  color: '#f59e0b',
                  '&:hover': { bgcolor: '#f59e0b', color: 'white' }
                }}
              >
                Skip Dept
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              rightIcon={ArrowRight}
              onClick={(e) => {
                e.stopPropagation();
                handleAssignClick(row);
              }}
              sx={{
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Assign
            </Button>
          </Box>
        );
      },
    }] : []),
  ];

  const handleConfirmAssign = () => {
    if (!selectedMechanic) {
      toastInfo(`Please select a ${assigneeLabel.toLowerCase()}`);
      return;
    }

    if (!selectedBay) {
      toastInfo('Please select a bay');
      return;
    }

    if (selectedBayItem?.availability === 'BUSY') {
      toastError('Selected bay is already busy');
      return;
    }

    const jobCardId = assignModal.item?.jobCardId || assignModal.item?.id;

    if (!jobCardId) {
      toastError('Valid job card is required');
      return;
    }

    assignMutation.mutate({
      jobCardId,
      payload: {
        assignedUserId: Number(selectedMechanic),
        bayId: Number(selectedBay),
        category: assignModal.item?.category || queueCategory
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title={pageTitle}
        breadcrumbs={[{ label: pageTitle }]}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search vehicle, owner"
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
          />
        </Box>
      </Box>

      {/* Data Tables Row */}
      <Box sx={{ mt: 1 }}>
        <Card sx={{ borderRadius: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #E5E7EB', height: '100%' }}>
          <Box sx={{ p: 3, pb: '24px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <User size={20} color="#6b7280" />
                <Typography variant="h6" fontWeight={800} sx={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pending Allocation
                </Typography>
              </Box>
            </Box>

            <DataTable
              columns={columns}
              data={filteredJobs}
              emptyMessage="No jobs pending allocation."
              loading={isLoading}
              serverSide={true}
              totalCount={jobsResponse?.meta?.total || jobsResponse?.data?.total || jobsResponse?.total || filteredJobs.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(newPage) => setPage(newPage)}
              onRowsPerPageChange={(newLimit) => {
                setRowsPerPage(newLimit);
                setPage(0);
              }}
              onRowDoubleClick={(row) => {
                const jobCardId = row.jobCardId || row.id || row.jobCardNo;
                if (jobCardId) {
                  setDetailModal({ isOpen: true, jobCardId, item: row });
                }
              }}
            />
          </Box>
        </Card>
      </Box>

      <Modal
        show={assignModal.isOpen && canAssignWork}
        onHide={() => {
          setAssignModal({ isOpen: false, item: null });
          setSelectedMechanic('');
          setSelectedBay('');
        }}
        title={`Assign ${assigneeLabel}`}
        confirmLabel="Assign"
        onConfirm={handleConfirmAssign}
        isConfirming={assignMutation.isPending}
        confirmIcon={Printer}
      >
        {assignModal.item && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Please assign a {assigneeLabel.toLowerCase()} for job <strong>{assignModal.item.jobCardNo || assignModal.item.id}</strong>.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>{`Select ${assigneeLabel}`}</InputLabel>
              <Select
                value={selectedMechanic}
                label={`Select ${assigneeLabel}`}
                onChange={(e) => setSelectedMechanic(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {isMechanicsLoading && (
                  <MenuItem disabled value="">
                    Loading {assigneeLabel.toLowerCase()}s...
                  </MenuItem>
                )}
                {!isMechanicsLoading && mechanics.length === 0 && (
                  <MenuItem disabled value="">
                    No active {assigneeLabel.toLowerCase()}s found
                  </MenuItem>
                )}
                {mechanics.map((mechanic) => (
                  <MenuItem key={mechanic.id} value={mechanic.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {mechanic.fullName}{mechanic.employeeCode ? ` (${mechanic.employeeCode})` : ''}
                      </Typography>
                      <Chip
                        size="small"
                        label={mechanic.availabilityLabel || (mechanic.activeJobCount > 0 ? `Busy (${mechanic.activeJobCount} jobs)` : 'Available')}
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: mechanic.activeJobCount > 0 ? '#FEF3C7' : '#DCFCE7',
                          color: mechanic.activeJobCount > 0 ? '#B45309' : '#15803D',
                          border: '1px solid',
                          borderColor: mechanic.activeJobCount > 0 ? '#FCD34D' : '#86EFAC',
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Bay Number</InputLabel>
              <Select
                value={selectedBay}
                label="Bay Number"
                onChange={(e) => setSelectedBay(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {isBaysLoading && (
                  <MenuItem disabled value="">
                    Loading bays...
                  </MenuItem>
                )}
                {!isBaysLoading && bays.length === 0 && (
                  <MenuItem disabled value="">
                    No active {BAY_TYPE_BY_CATEGORY[queueCategory]?.toLowerCase()} bays found
                  </MenuItem>
                )}
                {bays.map((bay) => {
                  const isBusy = bay.availability === 'BUSY';
                  return (
                    <MenuItem key={bay.id} value={bay.id} disabled={isBusy}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {bay.bayName || bay.bayCode}
                        </Typography>
                        <Chip
                          size="small"
                          label={bay.availabilityLabel || (isBusy ? 'Busy' : 'Available')}
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            bgcolor: isBusy ? '#FEF3C7' : '#DCFCE7',
                            color: isBusy ? '#B45309' : '#15803D',
                            border: '1px solid',
                            borderColor: isBusy ? '#FCD34D' : '#86EFAC',
                          }}
                        />
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            {/* 
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6b7280', fontSize: '0.875rem', mt: 1 }}>
              <Printer size={14} />
              <span>Assigning will automatically print a hard copy of the job card.</span>
            </Box> */}
          </Box>
        )}
      </Modal>

      <Modal
        show={skipModal.isOpen && canAssignWork}
        onHide={() => {
          setSkipModal({ isOpen: false, item: null });
          setSkipReason('');
        }}
        title={`Skip ${queueCategory === 'mechanical' ? 'Mechanical' : queueCategory === 'body-shop' ? 'Body Shop' : ''} Department`}
        confirmLabel="Confirm Skip"
        onConfirm={() => {
          if (!skipReason.trim()) {
            toastError("Reason is required to skip the department");
            return;
          }
          const jobCardId = skipModal.item?.jobCardId || skipModal.item?.id;
          skipMutation.mutate({
            jobCardId,
            payload: { reason: skipReason }
          });
        }}
        isConfirming={skipMutation.isPending}
      >
        {skipModal.item && (
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Skipping this department will postpone all remaining services for this job card in this queue and route it to the next department.
            </Typography>
            <TextField
              label="Reason for skipping"
              multiline
              rows={3}
              fullWidth
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="e.g. Waiting for spare parts..."
              required
            />
          </Box>
        )}
      </Modal>

      <JobCardDetailModal
        isOpen={detailModal.isOpen}
        jobCardId={detailModal.jobCardId}
        onClose={() => setDetailModal({ isOpen: false, jobCardId: null, item: null })}
        onAssign={canAssignWork ? () => {
          const itemToAssign = detailModal.item;
          setDetailModal({ isOpen: false, jobCardId: null, item: null });
          if (itemToAssign) handleAssignClick(itemToAssign);
        } : undefined}
      />

    </Box>
  );
}
