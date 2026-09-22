import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RHFTextField from '../../components/form/RHFTextField';
import RHFTextarea from '../../components/form/RHFTextarea';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { getModuleDetailApi, createModuleApi, updateModuleApi } from '../../api/adminModuleApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  moduleName: commonValidations.lettersOnly('Module name'),
  description: commonValidations.optionalDescription
});

export default function ModuleForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const moduleIdentifier = slug;
  const isEdit = !!moduleIdentifier;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      moduleName: '',
      description: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const fetchModule = async () => {
      if (isEdit) {
        try {
          setLoading(true);
          const res = await getModuleDetailApi(moduleIdentifier);
          if (res?.success) {
            const module = res.data.module;
            reset({
              moduleName: module.moduleName,
              description: module.description || ''
            });
            if (module.slug && module.slug !== moduleIdentifier) {
              navigate(ROUTES.ADMIN_MODULES_EDIT.replace(':slug', module.slug), { replace: true });
            }
          }
        } catch (error) {
          toastError(error?.message || 'Failed to load module details');
          navigate(ROUTES.ADMIN_MODULES);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchModule();
  }, [isEdit, moduleIdentifier, reset, navigate]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (isEdit) {
        const res = await updateModuleApi(moduleIdentifier, data);
        if (res?.success) {
          toastSuccess(`Module "${data.moduleName}" updated successfully.`);
          navigate(ROUTES.ADMIN_MODULES);
        }
      } else {
        const res = await createModuleApi(data);
        if (res?.success) {
          toastSuccess(`Module "${data.moduleName}" added successfully.`);
          navigate(ROUTES.ADMIN_MODULES);
        }
      }
    } catch (error) {
      toastError(error?.message || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} Module
        </Typography>
        <BackButton
          to={ROUTES.ADMIN_MODULES}
          label="Back to Modules"
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
                  name="moduleName"
                  label="Module Name"
                  placeholder="e.g. Sales"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextarea
                  name="description"
                  label="Description"
                  placeholder="Module description"
                  rows={3}
                />
              </Grid>
            </Grid>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_MODULES)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create Module'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
