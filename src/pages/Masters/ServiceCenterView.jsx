import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Grid, Skeleton } from '@mui/material';
import { Building2, Tag, ToggleRight, ToggleLeft, Monitor, Calendar, Clock, Hash, Phone, Mail, Link, Globe, Receipt } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../config/routes';
import { getServiceCenterApi } from '../../api/adminServiceCenterApi';
import { toastError } from '../../notifications/toast';

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

const DetailRow = ({ icon: Icon, label, value, isLast = false, isLink = false }) => (
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
      {isLink && value && value !== '-' ? (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
          {value}
        </a>
      ) : (
        value
      )}
    </Box>
  </Box>
);

export default function ServiceCenterView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serviceCenter, setServiceCenter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceCenter = async () => {
      try {
        const res = await getServiceCenterApi(id);
        if (res?.success) {
          setServiceCenter(res.data.serviceCenter || res.data);
        }
      } catch (error) {
        toastError(error?.message || 'Failed to fetch service center details');
        navigate(ROUTES.ADMIN_SERVICE_CENTERS);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceCenter();
  }, [id, navigate]);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Card sx={{ p: 4, borderRadius: 0, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 0 }} />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={800}>Service Center Details</Typography>
        <BackButton to={ROUTES.ADMIN_SERVICE_CENTERS} label="Back to Service Centers" />
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
          {/* Left Column: General Information */}
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
              <Building2 size={22} color="#2563eb" />
              <Typography variant="subtitle1" fontWeight={700} color="#2563eb">
                General Information
              </Typography>
            </Box>

            <Box>
              <DetailRow
                icon={Building2}
                label="Service Center Name"
                value={serviceCenter?.serviceCenterName || '-'}
              />
              <DetailRow
                icon={Hash}
                label="GST Number"
                value={serviceCenter?.gstNumber || '-'}
              />
              <DetailRow
                icon={Receipt}
                label="Tax"
                value={serviceCenter?.tax || '-'}
              />
              <DetailRow
                icon={Phone}
                label="Contact Number"
                value={serviceCenter?.contactPhone || '-'}
              />
              <DetailRow
                icon={Mail}
                label="Email Address"
                value={serviceCenter?.contactEmail || '-'}
              />
              <DetailRow
                icon={Globe}
                label="Website URL"
                value={serviceCenter?.websiteUrl || '-'}
                isLink={true}
              />
              <DetailRow
                icon={Link}
                label="Logo URL"
                value={serviceCenter?.logoUrl || '-'}
                isLink={true}
                isLast={true}
              />
            </Box>
          </Grid>

          {/* Right Column: System Information */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              pl: { md: 4 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Monitor size={22} color="#2563eb" />
              <Typography variant="subtitle1" fontWeight={700} color="#2563eb">
                System Information
              </Typography>
            </Box>

            <Box>
              <DetailRow
                icon={serviceCenter?.isActive ? ToggleRight : ToggleLeft}
                label="Status"
                value={
                  <Box
                    component="span"
                    sx={{
                      color: serviceCenter?.isActive ? '#059669' : '#dc2626',
                      fontWeight: 700,
                    }}
                  >
                    {serviceCenter?.isActive ? 'Active' : 'Inactive'}
                  </Box>
                }
              />
              <DetailRow
                icon={Calendar}
                label="Created On"
                value={formatDate(serviceCenter?.createdAt)}
              />
              <DetailRow
                icon={Clock}
                label="Last Updated"
                value={formatDate(serviceCenter?.updatedAt)}
                isLast={true}
              />
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
