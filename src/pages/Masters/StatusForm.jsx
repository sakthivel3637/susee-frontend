import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSelect from '../../components/form/RHFSelect';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { getStatusDetailApi, createStatusApi, updateStatusApi } from '../../api/adminStatusMasterApi';
import { getModulesApi } from '../../api/adminModuleApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  moduleId: commonValidations.requiredUnionId('module'),
  statusName: commonValidations.lettersOnly('Status name'),
  description: commonValidations.optionalDescription
});

export default function StatusForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const statusIdentifier = slug;
  const isEdit = !!statusIdentifier;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [modules, setModules] = useState([]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      moduleId: '',
      statusName: '',
      description: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await getModulesApi({ isActive: true });
        if (res?.success) {
          setModules(res.data.modules || []);
        }
      } catch (error) {
        toastError(error?.response?.data?.message || error?.message || 'Failed to fetch modules');
      }
    };

    fetchModules();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchStatusDetails = async () => {
        try {
          const res = await getStatusDetailApi(statusIdentifier);
          if (res?.success) {
            const statusToEdit = res.data.statusMaster;
            reset({
              moduleId: statusToEdit.moduleId || '',
              statusName: statusToEdit.statusName || '',
              description: statusToEdit.description || ''
            });

            if (statusToEdit.slug && statusToEdit.slug !== statusIdentifier) {
              navigate(ROUTES.ADMIN_MASTER_STATUSES_EDIT.replace(':slug', statusToEdit.slug), { replace: true });
            }
          }
        } catch (error) {
          toastError(error?.response?.data?.message || error?.message || 'Failed to fetch status details');
          navigate(ROUTES.ADMIN_MASTER_STATUSES);
        } finally {
          setLoading(false);
        }
      };
      fetchStatusDetails();
    }
  }, [isEdit, statusIdentifier, reset, navigate]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateStatusApi(statusIdentifier, data);
        if (res?.success) {
          toastSuccess(`Status "${data.statusName}" updated successfully.`);
          navigate(ROUTES.ADMIN_MASTER_STATUSES);
        }
      } else {
        const res = await createStatusApi(data);
        if (res?.success) {
          toastSuccess(`Status "${data.statusName}" added successfully.`);
          navigate(ROUTES.ADMIN_MASTER_STATUSES);
        }
      }
    } catch (error) {
      toastError(error?.response?.data?.message || error?.message || 'Failed to save status');
    } finally {
      setSaving(false);
    }
  };

  const moduleOptions = modules.filter(m => m.isActive !== false).map(m => ({ label: m.moduleName, value: m.id }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} Status
        </Typography>
        <BackButton
          to={ROUTES.ADMIN_MASTER_STATUSES}
          label="Back to Statuses"
        />
      </Box>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <RHFSelect
                name="moduleId"
                label="Module"
                options={moduleOptions}
                placeholder="Select a module"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="statusName"
                label="Status Name"
                placeholder="e.g. Pending"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="description"
                label="Description"
                placeholder="Status description"
              />
            </Grid>
          </Grid>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate(ROUTES.ADMIN_MASTER_STATUSES)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={saving}
            >
              {isEdit ? 'Save Changes' : 'Create Status'}
            </Button>
          </Box>
        </form>
      </FormProvider>
    </Box>
  );
}
