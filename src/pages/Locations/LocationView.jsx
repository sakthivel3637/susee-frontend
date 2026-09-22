import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Grid, Skeleton, IconButton, Tooltip } from '@mui/material';
import { Building2, User, Tag, ToggleRight, ToggleLeft, Monitor, Calendar, Clock, Key, Copy, ExternalLink } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { ROUTES } from '../../config/routes';
import { getLocationApi } from '../../api/adminLocationApi';
import { toastError, toastSuccess } from '../../notifications/toast';

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
    <Box sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
      {value}
    </Box>
  </Box>
);

export default function LocationView() {
  const { slug } = useParams();
  const locationIdentifier = slug;
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await getLocationApi(locationIdentifier);
        if (res?.success) {
          const fetchedLocation = res.data.location || res.data;
          setLocation(fetchedLocation);

          if (fetchedLocation.slug && fetchedLocation.slug !== locationIdentifier) {
            navigate(ROUTES.ADMIN_LOCATIONS_VIEW.replace(':slug', fetchedLocation.slug), { replace: true });
          }
        }
      } catch (error) {
        toastError(error?.response?.data?.message || error?.message || 'Failed to fetch location details');
        navigate(ROUTES.ADMIN_LOCATIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, [locationIdentifier, navigate]);

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
        <Typography variant="h5" fontWeight={800}>Location Details</Typography>
        <BackButton to={ROUTES.ADMIN_LOCATIONS} label="Back to Locations" />
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
          {/* Left Column: Location Information */}
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
                Location Information
              </Typography>
            </Box>

            <Box>
              <DetailRow
                icon={User}
                label="Location Name"
                value={location?.locationName || '-'}
              />
              <DetailRow
                icon={Tag}
                label="Location Code"
                value={location?.locationCode || '-'}
              />
              <DetailRow
                icon={Key}
                label="TV Kiosk Passkey"
                value={location?.kioskKey || 'Not configured'}
              />
              <DetailRow
                icon={Monitor}
                label="TV Display URL"
                value={
                  location?.kioskKey ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          fontFamily: 'monospace',
                          bgcolor: '#f8fafc',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          border: '1px solid #e2e8f0',
                          color: '#0f172a',
                          wordBreak: 'break-all',
                          fontSize: '0.8rem',
                        }}
                      >
                        {`${window.location.origin}/kiosk/tv?kioskKey=${location.kioskKey}`}
                      </Typography>
                      <Tooltip title="Copy TV URL">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/kiosk/tv?kioskKey=${location.kioskKey}`);
                            toastSuccess('TV Kiosk URL copied to clipboard');
                          }}
                          sx={{ color: '#2563eb', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                        >
                          <Copy size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open TV Display in New Tab">
                        <IconButton
                          size="small"
                          component="a"
                          href={`${window.location.origin}/kiosk/tv?kioskKey=${location.kioskKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: '#059669', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' } }}
                        >
                          <ExternalLink size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Configure a passkey to generate URL
                    </Typography>
                  )
                }
              />
              <DetailRow
                icon={location?.isActive ? ToggleRight : ToggleLeft}
                label="Status"
                isLast={true}
                value={
                  <Box
                    component="span"
                    sx={{
                      color: location?.isActive ? '#059669' : '#dc2626',
                      fontWeight: 700,
                    }}
                  >
                    {location?.isActive ? 'Active' : 'Inactive'}
                  </Box>
                }
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
                icon={Calendar}
                label="Created On"
                value={formatDate(location?.createdAt)}
              />
              <DetailRow
                icon={Clock}
                label="Last Updated"
                value={formatDate(location?.updatedAt)}
                isLast={true}
              />
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
