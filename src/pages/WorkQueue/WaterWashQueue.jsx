import { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Chip, Grid, Typography, Tooltip } from '@mui/material';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Droplets, Truck, UserPlus, } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/shared/PageHeader';
import VehicleNumberPlate from '../../components/common/VehicleNumberPlate';
import { ROUTES } from '../../config/routes';
import { getWaterWashDashboardApi } from '../../api/dashboardApi';
import Loader from '../../components/common/Loader';
import JobCardDetailModal from '../../components/common/JobCardDetailModal';
import { formatWaitTime } from '../../utils/formatters';

const SLA_MINUTES = 20;
const COLS = [
  { key: 'pending', label: 'Pending Water Wash', icon: Clock, color: '#F59E0B' },
  { key: 'assigned', label: 'Assigned Wash', icon: UserPlus, color: '#3B82F6' },
  { key: 'inProgress', label: 'Water Wash In Progress', icon: Droplets, color: '#8B5CF6' },
  { key: 'completed', label: 'Water Wash Completed', icon: CheckCircle2, color: '#10B981' },
];

const statusMeta = {
  UNASSIGNED: {
    label: 'Unassigned',
    tone: 'warning',
    action: 'Assign',
  },
  ASSIGNED: {
    label: 'Assigned',
    tone: 'info',
    action: 'Complete',
  },
  COMPLETED: {
    label: 'Wash Complete',
    tone: 'success',
    action: 'Ready to Delivery',
  },
  READY_FOR_DELIVERY: {
    label: 'Ready for Delivery',
    tone: 'success',
  },
};

const toneStyles = {
  warning: { bg: '#FFF7ED', border: '#FDBA74', color: '#C2410C' },
  info: { bg: '#ECFEFF', border: '#67E8F9', color: '#0E7490' },
  success: { bg: '#ECFDF5', border: '#86EFAC', color: '#047857' },
  danger: { bg: '#FEF2F2', border: '#FCA5A5', color: '#B42318' },
};

function StatusChip({ tone, icon, children }) {
  const style = toneStyles[tone] || toneStyles.info;
  return (
    <Chip
      icon={icon}
      label={children}
      size="small"
      sx={{
        bgcolor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontWeight: 800,
        borderRadius: '9999px',
        '& .MuiChip-icon': { color: 'inherit', ml: 1 },
      }}
    />
  );
}

function StageChip({ label }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid #86EFAC',
        bgcolor: '#ECFDF5',
        color: '#047857',
        borderRadius: '999px',
        px: 1,
        py: 0.3,
        fontSize: 11,
        fontWeight: 800,
        mr: 0.5,
        mb: 0.5,
      }}
    >
      {label}
    </Box>
  );
}

export default function WaterWashQueue() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [kpis, setKpis] = useState({ pending: 0, assigned: 0, inProgress: 0, completed: 0 });
  const [detailModal, setDetailModal] = useState({ isOpen: false, jobCardId: null });

  const isDashboard = location.pathname === ROUTES.WATER_WASH_DASHBOARD;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await getWaterWashDashboardApi();
        if (response.success) {
          setJobs(response.data?.queue || []);
          setKpis(response.data?.kpis || { pending: 0, assigned: 0, inProgress: 0, completed: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch water wash dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const openJob = (job) => {
    navigate(`${ROUTES.JOB_CARDS}/view/${job.slug || job.id}`);
  };

  const displayedJobs = useMemo(() => {
    return isDashboard ? jobs.slice(0, 4) : jobs;
  }, [isDashboard, jobs]);

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
      render: (row) => <VehicleNumberPlate vehicleNumber={row.vehicleNumber} />,
    },
    {
      header: 'CUSTOMER',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
            {row.customer}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {row.mobile}
          </Typography>
        </Box>
      ),
    },
    {
      header: 'VEHICLE',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
            {row.vehicle}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {row.details}
          </Typography>
        </Box>
      ),
    },
    // {
    //   header: 'SERVICES',
    //   render: (row) => (
    //     <Tooltip title={row.washService || ''} placement="bottom" arrow>
    //       <Typography sx={{
    //         fontSize: '0.875rem',
    //         color: '#374151',
    //         display: '-webkit-box',
    //         WebkitLineClamp: 2,
    //         WebkitBoxOrient: 'vertical',
    //         overflow: 'hidden',
    //         textOverflow: 'ellipsis',
    //         maxWidth: '250px'
    //       }}>
    //         {row.washService}
    //       </Typography>
    //     </Tooltip>
    //   ),
    // },
    {
      header: 'PREVIOUS STAGES',
      render: (row) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {row.previousStages.map((stage) => <StageChip key={stage} label={stage} />)}
        </Box>
      ),
    },
    // {
    //   header: 'EMPLOYEE',
    //   render: (row) => (
    //     <Chip
    //       label={row.assignee || 'Unassigned'}
    //       size="small"
    //       sx={{
    //         bgcolor: row.assignee ? '#eff6ff' : 'transparent',
    //         color: row.assignee ? '#2563eb' : '#d97706',
    //         border: `1px solid ${row.assignee ? '#bfdbfe' : '#fcd34d'}`,
    //         fontWeight: 600,
    //         borderRadius: '9999px',
    //       }}
    //     />
    //   ),
    // },
    // {
    //   header: 'BAY',
    //   render: (row) => {
    //     const bay = row.bay || row.assignedBay;
    //     return (
    //       <Typography sx={{ fontSize: '0.875rem', color: bay || row.bayName ? '#374151' : '#94a3b8', fontWeight: bay || row.bayName ? 600 : 500 }}>
    //         {bay?.bayName || bay?.bayCode || row.bayName || '—'}
    //       </Typography>
    //     );
    //   },
    // },
    {
      header: 'WAIT TIME',
      render: (row) => {
        if (['COMPLETED', 'READY_FOR_DELIVERY'].includes(row.status)) {
          return <Typography sx={{ color: '#059669', fontWeight: 800, fontSize: '0.875rem' }}>Done</Typography>;
        }

        const overdue = row.waitMinutes > SLA_MINUTES;
        return (
          <StatusChip tone={overdue ? 'danger' : 'info'} icon={overdue ? <AlertTriangle size={14} /> : undefined}>
            {overdue ? `${formatWaitTime(row.waitMinutes)} - overdue` : formatWaitTime(row.waitMinutes)}
          </StatusChip>
        );
      },
    },
    {
      header: 'STATUS',
      render: (row) => {
        const meta = statusMeta[row.status];
        return (
          <StatusChip
            tone={meta.tone}
            icon={row.status === 'READY_FOR_DELIVERY' ? <Truck size={14} /> : row.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : undefined}
          >
            {meta.label}
          </StatusChip>
        );
      },
    },
    {
      header: 'DELIVERY',
      render: (row) => (
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
          {row.status === 'READY_FOR_DELIVERY' ? `${row.delivery} ✓` : row.delivery}
        </Typography>
      ),
    },
    {
      header: 'ACTION',
      render: (row) => (
        <Button
          variant="primary"
          size="sm"
          rightIcon={ArrowRight}
          onClick={(event) => {
            event.stopPropagation();
            openJob(row);
          }}
          sx={{ fontWeight: 600, textTransform: 'none' }}
        >
          Open
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Loader size="lg" text="Loading dashboard..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F0F4FF', minHeight: '100%' }}>
      <Grid container spacing={3} sx={{ mb: 3, mt: 0 }}>
        {COLS.map((col) => {
          const Icon = col.icon;
          const count = kpis[col.key] || 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={col.key}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  borderTop: `4px solid ${col.color}`,
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" fontWeight={800} sx={{ color: col.color, lineHeight: 1 }}>
                      {count}
                    </Typography>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${col.color}15`, color: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} />
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" fontWeight={600}>
                    {col.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #E5E7EB', height: '100%' }}>
            <CardContent sx={{ p: 3, pb: '24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Droplets size={20} color="#6b7280" />
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {isDashboard ? 'RECENT WATER WASH QUEUE' : 'WATER WASH JOB QUEUE'}
                  </Typography>
                </Box>
                {/* <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', fontWeight: 500 }}>
                  💡 Tip: Double-click any row to view complete Job Card details
                </Typography> */}
              </Box>

              <DataTable
                columns={columns}
                data={displayedJobs}
                loading={false}
                showPagination={true}
                defaultItemsPerPage={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
                onRowDoubleClick={(row) => {
                  const jobCardId = row.jobCardId || row.id || row.slug || row.jobCardNo;
                  if (jobCardId) {
                    setDetailModal({ isOpen: true, jobCardId });
                  }
                }}
                emptyMessage="No vehicles in water wash queue"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <JobCardDetailModal
        isOpen={detailModal.isOpen}
        jobCardId={detailModal.jobCardId}
        onClose={() => setDetailModal({ isOpen: false, jobCardId: null })}
      />
    </Box>
  );
}
