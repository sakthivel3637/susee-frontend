import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Grid } from '@mui/material';
import { 
  User, Mail, Phone, MapPin, Shield, ToggleRight, ToggleLeft, 
  Calendar, Clock, CalendarDays, CreditCard, PhoneCall, Monitor 
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import Loader from '../../components/common/Loader';
import { ROUTES } from '../../config/routes';
import { getUserApi } from '../../api/userApi';
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

const DetailRow = ({ icon: Icon, label, value, isLast = false }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      py: 2.25,
      borderBottom: isLast ? 'none' : '1px solid',
      borderColor: '#cbd5e1',
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

export default function UserView() {
  const { slug } = useParams();
  const userIdentifier = slug;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserApi(userIdentifier);
        if (res?.success) {
          const fetchedUser = res.data.user || res.data;
          setUser(fetchedUser);

          if (fetchedUser.slug && fetchedUser.slug !== userIdentifier) {
            navigate(ROUTES.ADMIN_USER_VIEW.replace(':slug', fetchedUser.slug), { replace: true });
          }
        }
      } catch (error) {
        toastError(error?.message || 'Failed to fetch user details');
        navigate(ROUTES.ADMIN_USERS);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userIdentifier, navigate]);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Loader text="Loading user details..." />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={800}>User Details</Typography>
        <BackButton to={ROUTES.ADMIN_USERS} label="Back to Users" />
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
          {/* Left Column: User Information */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              borderRight: { md: '1px solid #cbd5e1' },
              pr: { md: 4 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <User size={22} color="#2563eb" />
              <Typography variant="subtitle1" fontWeight={700} color="#2563eb">
                User Information
              </Typography>
            </Box>

            <Box>
              <DetailRow icon={User} label="Full Name" value={user?.fullName || '-'} />
              <DetailRow icon={Mail} label="Email" value={user?.email || user?.emailId || '-'} />
              <DetailRow icon={Phone} label="Mobile" value={user?.mobile || user?.mobileNo || '-'} />
              <DetailRow icon={MapPin} label="Location" value={user?.location?.locationName || user?.locationName || '-'} />
              <DetailRow icon={Shield} label="Role" value={user?.role?.name || '-'} />
              <DetailRow
                icon={user?.isActive ? ToggleRight : ToggleLeft}
                label="Status"
                value={
                  <Box
                    component="span"
                    sx={{
                      color: user?.isActive ? '#059669' : '#dc2626',
                      fontWeight: 700,
                    }}
                  >
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </Box>
                }
                isLast={true}
              />
            </Box>
          </Grid>

          {/* Right Column: Personal & System Details */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              pl: { md: 4 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <User size={22} color="#2563eb" />
              <Typography variant="subtitle1" fontWeight={700} color="#2563eb">
                Personal Details
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <DetailRow icon={CalendarDays} label="Date of Birth" value={user?.dob ? new Date(user.dob).toLocaleDateString() : '-'} />
              <DetailRow icon={User} label="Gender" value={user?.gender || '-'} />
              <DetailRow icon={CreditCard} label="Licence Number" value={user?.licenceNumber || '-'} />
              <DetailRow icon={PhoneCall} label="Emergency Contact" value={user?.emergencyContact || '-'} />
              <DetailRow icon={MapPin} label="Address" value={user?.address || '-'} isLast={true} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Monitor size={22} color="#2563eb" />
              <Typography variant="subtitle1" fontWeight={700} color="#2563eb">
                System Details
              </Typography>
            </Box>

            <Box>
              <DetailRow icon={Calendar} label="Created On" value={formatDate(user?.createdAt)} />
              <DetailRow icon={Clock} label="Last Updated" value={formatDate(user?.updatedAt)} isLast={true} />
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
