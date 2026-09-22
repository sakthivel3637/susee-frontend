import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { adminBrandApi } from '../../api/adminBrandApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  name: commonValidations.alphaNumeric('Brand name')
});

export default function BrandForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const isEdit = !!slug;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [brandId, setBrandId] = useState(null);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const loadBrandData = async () => {
      if (!isEdit) return;
      
      setLoading(true);
      
      
      if (location.state?.brand) {
        reset({ name: location.state.brand.name });
        setBrandId(location.state.brand.id);
        setLoading(false);
        return;
      }
      
      
      try {
        const res = await adminBrandApi.getBrands({ limit: 100 });
        const brands = res.data?.brands || [];
        const found = brands.find(b => b.slug === slug || b.id === Number(slug));
        
        if (found) {
          reset({ name: found.name });
          setBrandId(found.id);
        } else {
          toastError('Brand not found');
          navigate(ROUTES.ADMIN_MASTER_BRANDS);
        }
      } catch (error) {
        toastError('Failed to load brand data');
        navigate(ROUTES.ADMIN_MASTER_BRANDS);
      } finally {
        setLoading(false);
      }
    };

    loadBrandData();
  }, [isEdit, slug, reset, navigate, location.state]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      if (isEdit) {
        if (!brandId) {
            toastError('Brand ID not found for update');
            return;
        }
        await adminBrandApi.updateBrand(brandId, data);
        toastSuccess(`Brand "${data.name}" updated successfully.`);
      } else {
        await adminBrandApi.createBrand(data);
        toastSuccess(`Brand "${data.name}" added successfully.`);
      }
      
      navigate(ROUTES.ADMIN_MASTER_BRANDS);
    } catch (error) {
      toastError(error.response?.data?.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} Brand
        </Typography>
        <BackButton
          to={ROUTES.ADMIN_MASTER_BRANDS}
          label="Back to Brand Master"
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
                  label="Brand Name"
                  placeholder="e.g. Hyundai"
                  required
                />
              </Grid>
            </Grid>

            {/* Footer Actions */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_MASTER_BRANDS)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create Brand'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
