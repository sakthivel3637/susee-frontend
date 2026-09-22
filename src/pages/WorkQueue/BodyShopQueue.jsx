import { useState, useEffect } from 'react';
import { Grid, Box, Typography, Card, CardContent, Chip, Tooltip } from '@mui/material';
import { Clock, CheckCircle2, User, AlertTriangle, ArrowRight, Paintbrush } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import { ROUTES } from '../../config/routes';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import { getBodyShopDashboardApi } from '../../api/dashboardApi';
import Loader from '../../components/common/Loader';
import JobCardDetailModal from '../../components/common/JobCardDetailModal';


const COLS = [
  { key: 'pending', label: 'Pending Body Work', icon: Clock, color: '#F59E0B' },
  { key: 'assigned', label: 'Assigned Body Shop', icon: User, color: '#3B82F6' },
  { key: 'inProgress', label: 'Body Work In Progress', icon: Paintbrush, color: '#8B5CF6' },
  { key: 'completed', label: 'Body Work Completed', icon: CheckCircle2, color: '#10B981' },
];

export default function BodyShopQueue() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [kpis, setKpis] = useState({ pending: 0, assigned: 0, inProgress: 0, completed: 0 });
  const [detailModal, setDetailModal] = useState({ isOpen: false, jobCardId: null });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await getBodyShopDashboardApi();
        if (response.success) {
          setQueue(response.data?.queue || []);
          setKpis(response.data?.kpis || { pending: 0, assigned: 0, inProgress: 0, completed: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch body shop dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

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
          {row.vehicleNumber}
        </Typography>
      ),
    },
    {
      header: 'CUSTOMER',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{row.customerName}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>{row.phone}</Typography>
        </Box>
      ),
    },
    {
      header: 'VEHICLE',
      render: (row) => (
        <Box>
          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{row.vehicleInfo}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>{row.vehicleSpec}</Typography>
        </Box>
      ),
    },
    {
      header: 'SERVICES',
      render: (row) => (
        <Tooltip title={row.services || ''} placement="bottom" arrow>
          <Typography sx={{
            fontSize: '0.875rem',
            color: '#374151',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '250px'
          }}>
            {row.services}
          </Typography>
        </Tooltip>
      ),
    },
    {
      header: 'MECHANIC',
      render: (row) => {
        const mechanicStr = row.mechanic || 'Unassigned';
        const mechanics = mechanicStr.split(',').map(name => name.trim()).filter(Boolean);
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {mechanics.map((mechanicName, idx) => (
              <Chip
                key={idx}
                label={mechanicName}
                size="small"
                sx={{
                  bgcolor: mechanicName === 'Unassigned' ? 'transparent' : '#eff6ff',
                  color: mechanicName === 'Unassigned' ? '#d97706' : '#2563eb',
                  border: `1px solid ${mechanicName === 'Unassigned' ? '#fcd34d' : '#bfdbfe'}`,
                  fontWeight: 600,
                  borderRadius: '9999px'
                }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      header: 'BAY',
      render: (row) => {
        const bay = row.bay || row.assignedBay;
        return (
          <Typography sx={{ fontSize: '0.875rem', color: bay || row.bayName ? '#374151' : '#94a3b8', fontWeight: bay || row.bayName ? 600 : 500 }}>
            {bay?.bayName || bay?.bayCode || row.bayName || '—'}
          </Typography>
        );
      },
    },
    {
      header: 'STATUS',
      render: (row) => (
        <Chip
          icon={row.status === 'Approval' ? <AlertTriangle size={14} /> : row.status === 'Done' ? <CheckCircle2 size={14} /> : undefined}
          label={row.status}
          size="small"
          sx={{
            bgcolor: row.status === 'In Queue' ? 'transparent' :
              row.status === 'Approval' ? '#fef3c7' :
                row.status === 'In Progress' ? '#eff6ff' :
                  row.status === 'Done' ? '#ecfdf5' : '#f3f4f6',
            color: row.status === 'In Queue' ? '#d97706' :
              row.status === 'Approval' ? '#d97706' :
                row.status === 'In Progress' ? '#2563eb' :
                  row.status === 'Done' ? '#059669' : '#4b5563',
            border: `1px solid ${row.status === 'In Queue' ? '#fcd34d' :
              row.status === 'Approval' ? '#fcd34d' :
                row.status === 'In Progress' ? '#bfdbfe' :
                  row.status === 'Done' ? '#a7f3d0' : '#e5e7eb'}`,
            fontWeight: 600,
            borderRadius: '9999px',
            '& .MuiChip-icon': { color: 'inherit', ml: 1 }
          }}
        />
      ),
    },
    {
      header: 'DELIVERY',
      render: (row) => (
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{row.delivery}</Typography>
      ),
    },
    {
      header: 'ACTION',
      render: (row) => (
        <Button
          variant="primary"
          size="sm"
          rightIcon={ArrowRight}
          onClick={() => navigate(`${ROUTES.JOB_CARDS}/view/${row.slug || row.id}`)}
          sx={{
            fontWeight: 600,
            textTransform: 'none',
          }}
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

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3, mt: 0 }}>
        {COLS.map((col, i) => {
          const Icon = col.icon;
          const count = kpis[col.key] || 0;
          return (
            <Grid item xs={12} sm={6} md={3} key={i}>
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

      {/* Data Tables Row */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #E5E7EB', height: '100%' }}>
            <CardContent sx={{ p: 3, pb: '24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Paintbrush size={20} color="#6b7280" />
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    RECENT BODY SHOP QUEUE
                  </Typography>
                </Box>
              </Box>

              <DataTable
                columns={columns}
                data={queue}
                loading={false}
                emptyMessage="No jobs in queue"
                showPagination={true}
                defaultItemsPerPage={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
                onRowDoubleClick={(row) => {
                  const jobCardId = row.jobCardId || row.id || row.slug || row.jobCardNo;
                  if (jobCardId) {
                    setDetailModal({ isOpen: true, jobCardId });
                  }
                }}
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
