import { Grid, Box, Typography, Card, CardContent, Chip } from "@mui/material";
import { Users, ShieldCheck, Wrench, ClipboardList,Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useAdminDashboard } from "../../queries/useDashboardQueries";
import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import KpiCard from "../../components/common/KpiCard";

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading } = useAdminDashboard();
  const summary = dashboardData?.data?.summary || {};
  const recentUsers = dashboardData?.data?.recentUsers || [];

  const columns = [
    {
      header: "Employee Code",
      accessor: "employeeCode",
      render: (row) => (
        <Typography variant="body2" fontWeight={600}>
          {row.employeeCode || "-"}
        </Typography>
      ),
    },
    {
      header: "User Name",
      accessor: "fullName",
      render: (row) => (
        <Typography variant="body2" fontWeight={600} color="#1E293B">
          {row.fullName}
        </Typography>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      render: (row) => row.role?.name || "-",
    },
    {
<<<<<<< HEAD
      header: "Email",
      accessor: "emailId",
    },
    {
      header: "Mobile",
      accessor: "mobileNo",
      render: (row) => row.mobileNo || "-",
=======
      header: 'Email & Contact',
      accessor: 'emailId',
      render: (row) => {
        const email = row.emailId || row.email;
        const mobile = row.mobileNo || row.mobile;
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {email ? (
              <Box
                component="a"
                href={`mailto:${email}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                <Mail size={14} style={{ marginRight: '8px', flexShrink: 0 }} /> {email}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">-</Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ pl: '22px' }}>
              {mobile || '-'}
            </Typography>
          </Box>
        );
      },
>>>>>>> 0ddbe5050b1217034ae4392ad51a3a62a73fa9b8
    },
    {
      header: "Status",
      accessor: "isActive",
      render: (row) => (
        <Chip
          label={row.isActive ? "Active" : "Inactive"}
          size="small"
          color={row.isActive ? "success" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      header: "Created Date",
      accessor: "createdAt",
      render: (row) => formatDate(row.createdAt),
    },
  ];

  const kpis = [
    {
      label: "Total Users",
      value: summary.totalUsers || 0,
      icon: Users,
      theme: "darkTeal",
      action: () => navigate(ROUTES.ADMIN_USERS),
    },
    {
      label: "Active Roles",
      value: summary.activeRoles || 0,
      icon: ShieldCheck,
      theme: "teal",
      action: () => navigate(ROUTES.ADMIN_ROLES),
    },
    {
      label: "Service Categories",
      value: summary.serviceCategories || 0,
      icon: ClipboardList,
      theme: "sky",
      action: () => navigate(ROUTES.ADMIN_MASTER_CATEGORIES),
    },
    {
      label: "Service Items",
      value: summary.serviceItems || 0,
      icon: Wrench,
      theme: "navy",
      action: () => navigate(ROUTES.ADMIN_MASTER_ITEMS),
    },
  ];

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <Loader size="lg" text="Loading dashboard..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: '19px' }, bgcolor: "#F0F4FF", minHeight: "100%" }}>
      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <KpiCard
              label={kpi.label}
              value={kpi.value}
              subtitle={kpi.subtitle}
              icon={kpi.icon}
              theme={kpi.theme}
              onClick={kpi.action}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Card
            sx={{
              borderRadius: 0,
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              border: "1px solid #E5E7EB",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3, pb: "24px !important" }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                Recently Added Users
              </Typography>
              <Box sx={{ p: "20px" }}>
                <DataTable
                  columns={columns}
                  data={recentUsers}
                  loading={false}
                  emptyMessage="No users found"
                  showPagination={false}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
