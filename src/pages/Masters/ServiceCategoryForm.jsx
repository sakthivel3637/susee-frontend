import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Typography } from '@mui/material';
import RHFTextField from '../../components/form/RHFTextField';
import RHFTextarea from '../../components/form/RHFTextarea';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { createServiceCategoryApi, updateServiceCategoryApi, getServiceCategoryApi } from '../../api/adminServiceCategoryApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  name: commonValidations.alphaNumeric('Category Name'),
  description: commonValidations.optionalDescription
});

export default function ServiceCategoryForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const categoryIdentifier = slug;
  const isEdit = !!categoryIdentifier;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (isEdit) {
      const fetchDetail = async () => {
        try {
          const res = await getServiceCategoryApi(categoryIdentifier);
          if (res?.success) {
            const category = res.data.serviceCategory || res.data;
            reset({
              name: category.name || '',
              description: category.description || ''
            });
            if (category.slug && category.slug !== categoryIdentifier) {
              navigate(ROUTES.ADMIN_MASTER_CATEGORIES_EDIT.replace(':slug', category.slug), { replace: true });
            }
          }
        } catch (error) {
          toastError('Failed to fetch service category details');
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isEdit, categoryIdentifier, navigate, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        description: data.description
      };

      if (isEdit) {
        await updateServiceCategoryApi(categoryIdentifier, payload);
        toastSuccess(`Category "${data.name}" updated successfully.`);
      } else {
        await createServiceCategoryApi(payload);
        toastSuccess(`Category "${data.name}" added successfully.`);
      }
      navigate(ROUTES.ADMIN_MASTER_CATEGORIES);
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to save service category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} Service Category
        </Typography>
        <BackButton 
          to={ROUTES.ADMIN_MASTER_CATEGORIES} 
          label="Back to Categories" 
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
                  name="name"
                  label="Category Name"
                  placeholder="e.g. Mechanical, Body Shop"
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <RHFTextarea
                  name="description"
                  label="Description"
                  rows={4}
                  placeholder="Enter category details..."
                />
              </Grid>
            </Grid>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_MASTER_CATEGORIES)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create Category'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
