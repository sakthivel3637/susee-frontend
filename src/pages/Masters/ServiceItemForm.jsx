import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Typography } from '@mui/material';
import RHFTextField from '../../components/form/RHFTextField';
import RHFTextarea from '../../components/form/RHFTextarea';
import RHFSelect from '../../components/form/RHFSelect';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { getServiceCategoriesApi } from '../../api/adminServiceCategoryApi';
import { createServiceItemApi, updateServiceItemApi, getServiceItemApi } from '../../api/adminServiceItemApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  categoryId: commonValidations.requiredNumber('Category Group'),
  name: commonValidations.alphaNumeric('Service Item Name'),
  description: commonValidations.optionalDescription,
  defaultPrice: z.coerce.number({ required_error: 'Base Price is required', invalid_type_error: 'Base Price is required' })
    .gt(0, 'Base Price must be greater than 0')
    .max(99999999.99, 'Base Price cannot exceed 99999999.99'),
  estimatedMinutes: z.union([
    z.coerce.number().gt(0, 'Duration must be greater than 0').max(2147483647, 'Duration cannot exceed 2147483647'),
    z.literal('')
  ]).optional()
});

export default function ServiceItemForm() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const itemIdentifier = slug;
  const isEdit = !!itemIdentifier;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [categories, setCategories] = useState([]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: '',
      name: '',
      description: '',
      defaultPrice: '',
      estimatedMinutes: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getServiceCategoriesApi();
        if (res?.success) {
          setCategories(res.data.serviceCategories || []);
        }
      } catch (error) {
        toastError('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchDetail = async () => {
        try {
          const res = await getServiceItemApi(itemIdentifier);
          if (res?.success) {
            const item = res.data.serviceItem || res.data;
            reset({
              categoryId: item.categoryId || '',
              name: item.name || '',
              description: item.description || '',
              defaultPrice: item.defaultPrice || '',
              estimatedMinutes: item.estimatedMinutes || ''
            });
            if (item.slug && item.slug !== itemIdentifier) {
              navigate(ROUTES.ADMIN_MASTER_ITEMS_EDIT.replace(':slug', item.slug), { replace: true });
            }
          }
        } catch (error) {
          toastError('Failed to fetch service item details');
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isEdit, itemIdentifier, navigate, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        defaultPrice: data.defaultPrice,
        estimatedMinutes: data.estimatedMinutes
      };

      if (isEdit) {
        await updateServiceItemApi(itemIdentifier, payload);
        toastSuccess(`Service Item "${data.name}" updated successfully.`);
      } else {
        await createServiceItemApi(payload);
        toastSuccess(`Service Item "${data.name}" created successfully.`);
      }
      navigate(ROUTES.ADMIN_MASTER_ITEMS);
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to save service item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} Service Item
        </Typography>
        <BackButton
          to={ROUTES.ADMIN_MASTER_ITEMS}
          label="Back to Service Items"
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
                  name="categoryId"
                  label="Category Group"
                  placeholder="Select Category Group"
                  options={categories.filter(c => c.isActive !== false).map(c => ({ value: c.id, label: c.name }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="name"
                  label="Service Item Name"
                  placeholder="e.g. Wheel Alignment"
                  required
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="defaultPrice"
                  type="number"
                  label="Base Price (₹)"
                  placeholder="e.g. 1500"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="estimatedMinutes"
                  type="number"
                  label="Estimated Duration (Mins)"
                  placeholder="e.g. 45"
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <RHFTextarea
                  name="description"
                  label="Description"
                  rows={3}
                  placeholder="Enter service details..."
                />
              </Grid>
            </Grid>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_MASTER_ITEMS)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create Service Item'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
