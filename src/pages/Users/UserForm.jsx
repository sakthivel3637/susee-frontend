import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Typography, Divider, IconButton } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSelect from '../../components/form/RHFSelect';
import RHFSwitch from '../../components/form/RHFSwitch';
import Button from '../../components/common/Button';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { createUserApi, updateUserApi, getUserApi } from '../../api/userApi';
import { getRolesApi } from '../../api/roleApi';
import { getLocationsApi } from '../../api/adminLocationApi';
import useAuthStore from '../../store/useAuthStore';
import BackButton from '../../components/common/BackButton';
import { usePermissions } from '../../hooks/usePermissions';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

import { commonValidations } from '../../validations/commonSchema';

const getValidationSchema = (canAssignLocation) => z.object({
  fullName: commonValidations.lettersOnly('Full Name'),
  email: commonValidations.email,
  mobile: commonValidations.mobile,
  roleId: commonValidations.requiredNumber('Role'),
  locationId: canAssignLocation ? commonValidations.requiredNumber('Location') : commonValidations.optionalAny,
  password: commonValidations.optionalPassword,
  status: commonValidations.optionalStatus,
  dob: z.string().trim().min(1, 'Date of Birth is required').refine((val) => {
    const inputDate = new Date(val);
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return inputDate <= eighteenYearsAgo;
  }, 'User must be at least 18 years old'),
  licenceNumber: commonValidations.licenceNumber,
  emergencyContact: commonValidations.optionalMobile,
  gender: commonValidations.requiredString('Gender'),
  address: commonValidations.address,
});

export default function UserForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const userIdentifier = slug;
  const isEdit = !!userIdentifier;

  const { user: currentUser } = useAuthStore();
  const { canRead } = usePermissions();
  const canAssignLocation = canRead('/locations');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);

  const methods = useForm({
    resolver: zodResolver(getValidationSchema(canAssignLocation)),
    defaultValues: {
      fullName: '',
      email: '',
      mobile: '',
      roleId: '',
      locationId: '',
      password: '',
      status: 'ACTIVE',
      dob: '',
      licenceNumber: '',
      emergencyContact: '',
      gender: '',
      address: '',
    },
  });

  const { handleSubmit, reset, formState } = methods;

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRolesApi({ limit: 100 });
        if (res?.success) {
          const fetchedRoles = res.data.roles || [];
          setRoles(fetchedRoles.filter(r => r.isActive !== false).map(r => ({ value: r.id, label: r.name })));
        }
      } catch (error) {
        toastError('Failed to fetch roles');
      }
    };
    const fetchLocations = async () => {
      if (!canAssignLocation) return;
      try {
        const res = await getLocationsApi({ limit: 100 });
        if (res?.success) {
          const fetchedLocations = res.data.locations || [];
          setLocations(fetchedLocations.filter(l => l.isActive !== false).map(l => ({ value: l.id, label: l.locationName })));
        }
      } catch (error) {
        toastError('Failed to fetch locations');
      }
    };
    fetchRoles();
    fetchLocations();
  }, [canAssignLocation]);

  useEffect(() => {
    if (isEdit) {
      const fetchUser = async () => {
        try {
          const res = await getUserApi(userIdentifier);
          if (res?.success) {
            const user = res.data.user || res.data;
            reset({
              fullName: user.fullName || '',
              email: user.email || user.emailId || '',
              mobile: user.mobile || user.mobileNo || '',
              roleId: user.role?.id || user.roleId || '',
              locationId: user.location?.id || user.locationId || '',
              status: user.isActive ? 'ACTIVE' : 'INACTIVE',
              dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
              licenceNumber: user.licenceNumber || '',
              emergencyContact: user.emergencyContact || '',
              gender: user.gender || '',
              address: user.address || '',
            });

            if (user.slug && user.slug !== userIdentifier) {
              navigate(ROUTES.ADMIN_USER_EDIT.replace(':slug', user.slug), { replace: true });
            }
          }
        } catch (error) {
          toastError('Failed to fetch user details');
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [userIdentifier, isEdit, reset, navigate]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        roleId: data.roleId,
        locationId: canAssignLocation ? data.locationId : (currentUser?.locationId || currentUser?.location?.id),
        password: isEdit ? undefined : (data.password || undefined),
        isActive: data.status === 'ACTIVE',
        dob: data.dob,
        licenceNumber: data.licenceNumber,
        emergencyContact: data.emergencyContact,
        gender: data.gender,
        address: data.address
      };

      if (isEdit) {
        await updateUserApi(userIdentifier, payload);
        toastSuccess(`User "${data.fullName}" updated!`);
      } else {
        await createUserApi(payload);
        toastSuccess(`User "${data.fullName}" created!`);
      }
      navigate(ROUTES.ADMIN_USERS);
    } catch (error) {
      toastError(error?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit User' : 'Add New User'}
        </Typography>
        {/* <Box
          component="button"
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
          className="back-btn"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, background: 'none', cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <ArrowLeft size={16} /> Back to List
        </Box> */}
        <BackButton to={ROUTES.ADMIN_USERS} label="Back to User List" />
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
              User Information
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="fullName"
                  label="Full Name"
                  placeholder="Enter full name"
                  required
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    methods.setValue('fullName', cleanVal, { shouldValidate: true });
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField name="email" label="Email Address" type="email" placeholder="Enter email address" required />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="mobile"
                  label="Mobile Number"
                  placeholder="Enter mobile number"
                  required
                  inputProps={{ maxLength: 10 }}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                    methods.setValue('mobile', cleanVal, { shouldValidate: true });
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFSelect name="roleId" label="Role" options={roles} placeholder="Select role" required />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 4, mb: 2, color: 'text.primary' }}>
              Personal Details
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFSelect
                  name="gender"
                  label="Gender"
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="licenceNumber"
                  label="Licence Number"
                  placeholder="Enter licence number"
                  required
                  inputProps={{ maxLength: 15 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="emergencyContact"
                  label="Emergency Contact Number"
                  placeholder="Enter emergency contact number"
                  inputProps={{ maxLength: 10 }}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                    methods.setValue('emergencyContact', cleanVal, { shouldValidate: true });
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <RHFTextField
                  name="address"
                  label="Address"
                  placeholder="Enter address"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>

            {canAssignLocation && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <RHFSelect name="locationId" label="Location" options={locations} placeholder="Select location" required />
                </Grid>
              </Grid>
            )}

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Submit'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
