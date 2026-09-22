import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography, Select } from '@mui/material';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSelect from '../../components/form/RHFSelect';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { getStatesApi } from '../../api/adminStateApi';
import { getDistrictDetailApi, createDistrictApi, updateDistrictApi } from '../../api/adminDistrictApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  stateId: commonValidations.requiredNumber('State'),
  districtName: commonValidations.lettersOnly('District name')
});

export default function DistrictForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const districtIdentifier = slug;
  const isEdit = !!districtIdentifier;
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [states, setStates] = useState([]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      districtName: '',
      stateId: ''
    }
  });

  const { handleSubmit, reset, register } = methods;

  useEffect(() => {
    const loadData = async () => {
      try {
        const stateRes = await getStatesApi();
        if (stateRes?.success) {
          setStates(stateRes.data.states || []);
        }

        if (isEdit) {
          setLoading(true);
          const res = await getDistrictDetailApi(districtIdentifier);
          if (res?.success) {
            const district = res.data.district;
            reset({
              districtName: district.districtName,
              stateId: district.stateId
            });
            if (district.slug && district.slug !== districtIdentifier) {
              navigate(ROUTES.ADMIN_MASTER_DISTRICTS_EDIT.replace(':slug', district.slug), { replace: true });
            }
          }
        }
      } catch (error) {
        toastError(error?.message || 'Failed to load data');
        if (isEdit) navigate(ROUTES.ADMIN_MASTER_DISTRICTS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isEdit, districtIdentifier, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (isEdit) {
        const res = await updateDistrictApi(districtIdentifier, data);
        if (res?.success) {
          toastSuccess(`District "${data.districtName}" updated successfully.`);
          navigate(ROUTES.ADMIN_MASTER_DISTRICTS);
        }
      } else {
        const res = await createDistrictApi(data);
        if (res?.success) {
          toastSuccess(`District "${data.districtName}" added successfully.`);
          navigate(ROUTES.ADMIN_MASTER_DISTRICTS);
        }
      }
    } catch (error) {
      toastError(error?.message || 'Failed to save district');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} District
        </Typography>
        <BackButton
          to={ROUTES.ADMIN_MASTER_DISTRICTS}
          label="Back to Districts Master"
        />
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RHFSelect
                  name="stateId"
                  label="State"
                  placeholder="Select a State"
                  options={states.filter(s => s.isActive !== false).map(s => ({ value: s.id, label: s.stateName }))}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="districtName"
                  label="District Name"
                  placeholder="e.g. Chennai"
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_MASTER_DISTRICTS)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create District'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
