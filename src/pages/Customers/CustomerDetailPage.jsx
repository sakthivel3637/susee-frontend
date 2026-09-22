import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Grid } from '@mui/material';
import { User, Mail, Phone, ToggleRight, ToggleLeft, Calendar, Clock, MapPin, Activity } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import Loader from '../../components/common/Loader';
import { ROUTES } from '../../config/routes';
import { useCustomerDetails } from '../../queries/useDataQueries';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return 'N/A';
  }
};

const DetailRow = ({ icon: Icon, label, value, isLast = false }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      py: 2.25,
      borderBottom: isLast ? 'none' : '1px solid',
      borderColor: '#eff6ff',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          bgcolor: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563eb',
          mr: 2,
        }}
      >
        <Icon size={18} />
      </Box>
      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
    <Box sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem', textAlign: 'right', wordBreak: 'break-all', maxWidth: '50%' }}>
      {value}
    </Box>
  </Box>
);

export default function CustomerDetailPage() {
  const { id, slug } = useParams();
  const navigate = useNavigate();

  const identifier = slug || id;
  const { data: response, isLoading } = useCustomerDetails(identifier);
  const customer = response?.data;
  const history = customer?.jobCards || [];

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Loader text="Loading customer details..." />
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight={800}>Customer Details</Typography>
          <BackButton to={ROUTES.CUSTOMERS} label="Back to Customers" />
        </Box>
        <Card sx={{ p: 4, borderRadius: 0, boxShadow: 'none', border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">Customer not found.</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={800}>Customer Details</Typography>
        <BackButton to={ROUTES.CUSTOMERS} label="Back to Customers" />
      </Box>

      <Card
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 0,
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.05)',
          border: '1px solid #dce6f5',
          bgcolor: '#FFFFFF',
        }}
      >
        <Grid container spacing={4}>
          {/* Left Column: Customer Information */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              borderRight: { md: '1px solid #eff6ff' },
              pr: { md: 4 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <User size={22} color="#2563eb" />
              <Typography variant="subtitle1" fontWeight={700} color="#2563eb">
                Customer Information
              </Typography>
            </Box>

            <Box>
              <DetailRow
                icon={User}
                label="Full Name"
                value={customer?.fullName || '-'}
              />
              <DetailRow
                icon={Mail}
                label="Email"
                value={customer?.emailId || '-'}
              />
              <DetailRow
                icon={Phone}
                label="Mobile"
                value={customer?.mobileNo || '-'}
              />
              <DetailRow
                icon={Phone}
                label="Alternative Mobile"
                value={customer?.alternateMobileNo || '-'}
              />
              <DetailRow
                icon={MapPin}
                label="Address"
                value={customer?.address || '-'}
                isLast={true}
              />
            </Box>
          </Grid>

          {/* Right Column: System & Activity Details */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              pl: { md: 4 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Activity size={22} color="#2563eb" />
              <Typography variant="subtitle1" fontWeight={700} color="#2563eb">
                System & Activity Details
              </Typography>
            </Box>

            <Box>
              <DetailRow
                icon={customer?.isActive ? ToggleRight : ToggleLeft}
                label="Status"
                value={
                  <Box
                    component="span"
                    sx={{
                      color: customer?.isActive ? '#059669' : '#dc2626',
                      fontWeight: 700,
                    }}
                  >
                    {customer?.isActive ? 'Active' : 'Inactive'}
                  </Box>
                }
              />
              <DetailRow
                icon={Activity}
                label="Total Service Visits"
                value={`${history.length || 0} visits`}
              />
              <DetailRow
                icon={Calendar}
                label="Created On"
                value={formatDate(customer?.createdAt)}
              />
              <DetailRow
                icon={Clock}
                label="Last Updated"
                value={formatDate(customer?.updatedAt)}
                isLast={true}
              />
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
