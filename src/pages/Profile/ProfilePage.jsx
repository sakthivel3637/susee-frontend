import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography, Avatar, Divider } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/useAuthStore';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROLE_LABELS } from '../../constants/roles';
import { getInitials, avatarColor } from '../../utils/helpers';
import { updateProfileApi } from '../../api/authApi';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  name: commonValidations.lettersOnly('Full Name', 50),
  email: commonValidations.email,
  phone: commonValidations.mobile
});

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, setUser } = useAuthStore();

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.fullName || user?.name || '',
      email: user?.emailId || user?.email || '',
      phone: user?.mobileNo || user?.phone || '',
    },
  });

  const { handleSubmit, formState: { isSubmitting }, reset } = methods;

  const onSubmit = async (data) => {
    try {
      const response = await updateProfileApi({
        fullName: data.name,
        emailId: data.email,
        mobileNo: data.phone
      });

      // Update User details
      if (response?.success && response?.data?.user) {
        setUser(response.data.user);
      }

      reset(data);
      toastSuccess('Profile updated successfully!');
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Profile & Security
        </Typography>
        <Box
          component="button"
          onClick={() => navigate(-1)}
          className="back-btn"
        >
          <ArrowLeft size={16} /> Back
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Avatar
          sx={{
            width: 80, height: 80, bgcolor: avatarColor(user?.fullName || user?.name),
            fontSize: '24px', fontWeight: 'bold'
          }}
        >
          {getInitials(user?.fullName || user?.name || 'U')}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>{user?.fullName || user?.name || 'User'}</Typography>
          <Typography variant="body2" color="text.secondary">{ROLE_LABELS[role] || role}</Typography>
        </Box>
      </Box>

      {/* Combined Form */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Personal Information
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <RHFTextField name="name" label="Full Name" placeholder="Enter full name" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="email"
                label="Email Address"
                type="email"
                placeholder="Enter email address"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="phone"
                label="Phone Number"
                placeholder="Enter phone number"
                required
                inputProps={{ maxLength: 10 }}
                onInput={(e) => {
                 
                  e.target.value = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save All Changes
            </Button>
          </Box>
        </form>
      </FormProvider>
    </Box>
  );
}
