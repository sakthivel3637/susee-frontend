import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography, MenuItem } from '@mui/material';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSelect from '../../components/form/RHFSelect';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { adminBayApi } from '../../api/adminBayApi';
import { commonValidations } from '../../validations/commonSchema';
import { usePermissions } from '../../hooks/usePermissions';
import { getLocationsApi } from '../../api/adminLocationApi';

const getValidationSchema = (canAssignLocation) => z.object({
  bayName: commonValidations.alphaNumeric('Bay name'),
  bayType: z.string().min(1, 'Bay type is required'),
  locationId: canAssignLocation ? commonValidations.requiredNumber('Location') : commonValidations.optionalAny
});

const BAY_TYPES = [
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Body Shop', label: 'Body Shop' },
  { value: 'Water Wash', label: 'Water Wash' }
];

export default function BayForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const isEdit = !!slug;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [bayId, setBayId] = useState(null);

  const { canRead } = usePermissions();
  const canAssignLocation = canRead('/locations');
  const [locations, setLocations] = useState([]);

  const methods = useForm({
    resolver: zodResolver(getValidationSchema(canAssignLocation)),
    defaultValues: {
      bayName: '',
      bayType: '',
      locationId: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
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
    fetchLocations();
  }, [canAssignLocation]);

  useEffect(() => {
    const loadBayData = async () => {
      if (!isEdit) return;
      
      setLoading(true);
      
      if (location.state?.bay) {
        reset({ 
          bayName: location.state.bay.bayName,
          bayType: location.state.bay.bayType,
          locationId: location.state.bay.locationId || ''
        });
        setBayId(location.state.bay.id);
        setLoading(false);
        return;
      }
      
      try {
        const res = await adminBayApi.getBays({ limit: 100 });
        const bays = res.data?.bays || [];
        const found = bays.find(b => b.bayCode === slug || b.id === Number(slug));
        
        if (found) {
          reset({ 
            bayName: found.bayName,
            bayType: found.bayType,
            locationId: found.locationId || ''
          });
          setBayId(found.id);
        } else {
          toastError('Bay not found');
          navigate(ROUTES.MD_BAYS);
        }
      } catch (error) {
        toastError('Failed to fetch bay details');
        navigate(ROUTES.MD_BAYS);
      } finally {
        setLoading(false);
      }
    };

    loadBayData();
  }, [isEdit, slug, reset, navigate, location.state]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      const payload = {
        bayName: data.bayName,
        bayType: data.bayType,
      };

      if (canAssignLocation && data.locationId) {
        payload.locationId = data.locationId;
      }
      
      if (isEdit) {
        if (!bayId) {
            toastError('Bay ID not found for update');
            return;
        }
        await adminBayApi.updateBay(bayId, payload);
        toastSuccess(`Bay "${data.bayName}" updated successfully.`);
      } else {
        await adminBayApi.createBay(payload);
        toastSuccess(`Bay "${data.bayName}" added successfully.`);
      }
      
      navigate(ROUTES.MD_BAYS);
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to save bay');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} Bay
        </Typography>
        <BackButton
          to={ROUTES.MD_BAYS}
          label="Back to Bay Master"
        />
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="bayName"
                  label="Bay Name"
                  placeholder="e.g. Bay 1"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFSelect
                  name="bayType"
                  label="Bay Type"
                  options={BAY_TYPES}
                  placeholder="Select Type"
                  required
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
                onClick={() => navigate(ROUTES.MD_BAYS)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create Bay'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
