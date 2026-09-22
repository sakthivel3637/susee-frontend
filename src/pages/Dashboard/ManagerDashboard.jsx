import { useState, useEffect } from 'react';
import { Box, Card, Grid, Typography, CircularProgress } from '@mui/material';
import {
  AlertTriangle,
  BarChart3,
  Car,
  CheckCircle2,
  ClipboardList,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import VehicleNumberPlate from '../../components/common/VehicleNumberPlate';
import { ROUTES } from '../../config/routes';
import { getManagerDashboardApi } from '../../api/dashboardApi';
import useAuthStore from '../../store/useAuthStore';
import Loader from '../../components/common/Loader';


const ICON_MAP = {
  'Total Today': Car,
  'Completed': CheckCircle2,
  'JC Pending': ClipboardList,
  'Delayed': AlertTriangle
};

const toneStyles = {
  danger: { bg: '#FEF2F2', border: '#FCA5A5', color: '#B42318' },
  warning: { bg: '#FFFBEB', border: '#FCD34D', color: '#B7791F' },
  success: { bg: '#ECFDF5', border: '#86EFAC', color: '#047857' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' },
  purple: { bg: '#F5F3FF', border: '#DDD6FE', color: '#7C3AED' },
};

function StagePill({ tone, children }) {
  const style = toneStyles[tone] || toneStyles.info;
  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', alignItems: 'center', border: '1px solid', borderColor: style.border, bgcolor: style.bg, color: style.color, borderRadius: '999px', px: 1, py: 0.35, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', }}
    >
      {children}
    </Box>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(5);
  const [data, setData] = useState({
    kpis: [],
    pipeline: [],
    vehicles: [],
    pagination: { total: 0 }
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setTableLoading(true);
        const response = await getManagerDashboardApi({ page: page + 1, limit });
        if (response.success) {
          setData(response.data || { kpis: [], pipeline: [], vehicles: [], pagination: { total: 0 } });
        }
      } catch (error) {
        console.error('Failed to fetch manager dashboard:', error);
      } finally {
        setInitialLoading(false);
        setTableLoading(false);
      }
    };

    fetchDashboard();
  }, [page, limit]);
  const jobCardColumns = [
    {
      header: 'Job Card',
      accessor: 'id',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155' }}>
          {row.id}
        </Typography>
      ),
    },
    {
      header: 'Vehicle',
      render: (row) => <VehicleNumberPlate vehicleNumber={row.vehicleNumber} />,
    },
    { header: 'Owner', accessor: 'ownerName' },
    { header: 'Mobile Number', accessor: 'ownerMobile' },
    {
      header: 'Stage',
      render: (row) => <StagePill tone={row.stageTone}>{row.stage}</StagePill>,
    },
    {
      header: 'Technician',
      render: (row) => row.technician || <Typography variant="body2" color="text.secondary">Unassigned</Typography>,
    },
    {
      header: 'Est. Cost',
      render: (row) => (
        <Typography variant="body2" fontWeight={800}>
          Rs. {row.estimatedCost.toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          variant="primary"
          size="sm"
          rightIcon={Eye}
          onClick={(event) => {
            event.stopPropagation();
            navigate(`${ROUTES.JOB_CARDS}/${row.id}`);
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100%' }}>
      {initialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Loader size="lg" text="Loading dashboard..." />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3, mt: 0 }}>
            {data.kpis?.map((kpi) => {
              const Icon = ICON_MAP[kpi.label] || Car;
              return (
                <Grid item xs={12} sm={6} md={3} key={kpi.label}>
                  <Card
                    sx={{ borderRadius: 3, border: '1px solid #E2E8F0', borderTop: '6px solid', borderTopColor: kpi.color, boxShadow: '0 12px 24px -22px rgba(15, 23, 42, 0.7)', position: 'relative', overflow: 'hidden', bgcolor: '#FFFFFF', }}
                  >
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: kpi.color, lineHeight: 1 }}>
                          {kpi.value}
                        </Typography>
                        <Box sx={{ width: 46, height: 46, borderRadius: 3, bgcolor: kpi.iconBg, color: kpi.color, display: 'grid', placeItems: 'center', }}>
                          <Icon size={21} />
                        </Box>
                      </Box>
                      <Typography variant="subtitle1" sx={{ color: '#334155', fontWeight: 800 }}>
                        {kpi.label}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Card sx={{ borderRadius: 2, border: '1px solid #D8E2F3', mb: 2 }}>
            <Box sx={{ p: 2.25 }}>
              <Typography variant="caption" sx={{ color: '#8A9AB5', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Pipeline overview
              </Typography>
              <Box
                sx={{ borderTop: '1px solid #D8E2F3', mt: 1.25, pt: 2, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 2, lg: 3 }, pb: 0.5, }}
              >
                {data.pipeline?.map((stage, index) => (
                  <Box key={stage.label} sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'center', gap: { xs: 1.25, lg: 2 }, flex: 1, width: '100%' }}>
                    <Box sx={{ width: '100%', minHeight: 96, borderRadius: 1.5, border: '1px solid', borderColor: stage.color, bgcolor: stage.bg, p: 1.5, '&:hover': { boxShadow: '0 10px 20px -18px rgba(15,23,42,0.9)' }, }}>
                      <Typography variant="caption" sx={{ display: 'block', color: stage.color, fontWeight: 900, textTransform: 'uppercase', fontSize: 10 }}>
                        {stage.label}
                      </Typography>
                      <Typography variant="h5" sx={{ color: stage.color, fontWeight: 900, my: 0.5 }}>{stage.value}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: 10 }}>{stage.meta}</Typography>
                    </Box>
                    {index < data.pipeline?.length - 1 && (
                      <Typography sx={{ color: '#94A3B8', fontWeight: 900, transform: { xs: 'rotate(90deg)', lg: 'none' } }}>
                        {/* {'->'} */}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>

          <Card sx={{ borderRadius: 2, border: '1px solid #D8E2F3', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #D8E2F3', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart3 size={18} color="#2563EB" />
              <Typography variant="caption" sx={{ color: '#8A9AB5', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Recent job cards - click a row to view details
              </Typography>
            </Box>
            <DataTable
              columns={jobCardColumns}
              data={data.vehicles || []}
              loading={tableLoading}
              showPagination={true}
              serverSide={true}
              totalCount={data.pagination?.total || 0}
              page={page}
              rowsPerPage={limit}
              rowsPerPageOptions={[5, 10, 25, 50]}
              onPageChange={(newPage) => setPage(newPage)}
              onRowsPerPageChange={(newLimit) => setLimit(newLimit)}
              onRowClick={(row) => navigate(`${ROUTES.JOB_CARDS}/${row.id}`)}
              emptyMessage="No recent job cards found"
            />
          </Card>
        </>
      )}
    </Box>
  );
}
