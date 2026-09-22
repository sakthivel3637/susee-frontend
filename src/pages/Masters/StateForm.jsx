import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { getStateDetailApi, createStateApi, updateStateApi } from '../../api/adminStateApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  stateName: commonValidations.lettersOnly('State name')
});

export default function StateForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const stateIdentifier = slug;
  const isEdit = !!stateIdentifier;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      stateName: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const fetchState = async () => {
      if (isEdit) {
        try {
          setLoading(true);
          const res = await getStateDetailApi(stateIdentifier);
          if (res?.success) {
            const state = res.data.state;
            reset({
              stateName: state.stateName
            });
            if (state.slug && state.slug !== stateIdentifier) {
              navigate(ROUTES.ADMIN_MASTER_STATES_EDIT.replace(':slug', state.slug), { replace: true });
            }
          }
        } catch (error) {
          toastError(error?.message || 'Failed to load state details');
          navigate(ROUTES.ADMIN_MASTER_STATES);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchState();
  }, [isEdit, stateIdentifier, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (isEdit) {
        const res = await updateStateApi(stateIdentifier, data);
        if (res?.success) {
          toastSuccess(`State "${data.stateName}" updated successfully.`);
          navigate(ROUTES.ADMIN_MASTER_STATES);
        }
      } else {
        const res = await createStateApi(data);
        if (res?.success) {
          toastSuccess(`State "${data.stateName}" added successfully.`);
          navigate(ROUTES.ADMIN_MASTER_STATES);
        }
      }
    } catch (error) {
      toastError(error?.message || 'Failed to save state');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} State
        </Typography>
        <BackButton
          to={ROUTES.ADMIN_MASTER_STATES}
          label="Back to States Master"
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
                  name="stateName"
                  label="State Name"
                  placeholder="e.g. Tamil Nadu"
                  required
                />
              </Grid>
            </Grid>

            {/* Footer Actions */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_MASTER_STATES)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create State'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
