import { Grid, Box, Typography, Card, CardContent, Chip } from '@mui/material';
import {
  Users, ShieldCheck, Wrench, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { useAdminDashboard } from '../../queries/useDashboardQueries';
import DataTable from '../../components/common/DataTable';
import Loader from '../../components/common/Loader';

const formatDate = (dateValue) => {
  if (!dateValue) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateValue));
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading } = useAdminDashboard();
  const summary = dashboardData?.data?.summary || {};
  const recentUsers = dashboardData?.data?.recentUsers || [];

  const columns = [
    {
      header: 'Employee Code',
      accessor: 'employeeCode',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.employeeCode || '-'}</Typography>
    },
    {
      header: 'User Name',
      accessor: 'fullName',
      render: (row) => <Typography variant="body2" fontWeight={600} color="#1E293B">{row.fullName}</Typography>
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => row.role?.name || '-'
    },
    {
      header: 'Email',
      accessor: 'emailId'
    },
    {
      header: 'Mobile',
      accessor: 'mobileNo',
      render: (row) => row.mobileNo || '-'
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive ? 'success' : 'default'}
          variant="outlined"
        />
      )
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      render: (row) => formatDate(row.createdAt)
    }
  ];

  const kpis = [
    {
      label: 'Total Users',
      value: summary.totalUsers || 0,
      icon: Users,
      color: '#1a434d',
      progressBarColor: '#2563eb',
      action: () => navigate(ROUTES.ADMIN_USERS),
    },
    {
      label: 'Active Roles',
      value: summary.activeRoles || 0,
      icon: ShieldCheck,
      color: '#2dd4bf',
      progressBarColor: '#059669',
      action: () => navigate(ROUTES.ADMIN_ROLES),
    },
    {
      label: 'Service Categories',
      value: summary.serviceCategories || 0,
      icon: ClipboardList,
      color: '#0ea5e9',
      progressBarColor: '#d97706',
      action: () => navigate(ROUTES.ADMIN_MASTER_CATEGORIES),
    },
    {
      label: 'Service Items',
      value: summary.serviceItems || 0,
      icon: Wrench,
      color: '#13323a',
      progressBarColor: '#dc2626',
      action: () => navigate(ROUTES.ADMIN_MASTER_ITEMS),
    },

  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Loader size="lg" text="Loading dashboard..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f0f4ff', minHeight: '100%' }}>
      {/* <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, bgcolor: '#FFFFFF', p: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(45, 212, 191, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a434d' }}>
            <Crown size={24} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#000" sx={{ lineHeight: 1.2 }}>
              Super Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Overview of platform users, roles, and service masters
            </Typography>
          </Box>
        </Box>
      </Box> */}

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card
                sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', borderTop: `4px solid ${kpi.color}`, height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', }}
              // onClick={kpi.action}
              >
                <CardContent sx={{ p: 3, pb: '24px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h3" fontWeight={800} sx={{ color: kpi.color, mb: 1 }}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" fontWeight={600}>
                        {kpi.label}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Card sx={{ borderRadius: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #E5E7EB', height: '100%' }}>
            <CardContent sx={{ p: 3, pb: '24px !important' }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                Recently Added Users
              </Typography>
              <Box sx={{ p: '20px' }}>
                <DataTable columns={columns} data={recentUsers} loading={false} emptyMessage="No users found" showPagination={false} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
