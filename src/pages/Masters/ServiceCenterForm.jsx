import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Grid, Typography } from '@mui/material';
import RHFTextField from '../../components/form/RHFTextField';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { createServiceCenterApi, updateServiceCenterApi, getServiceCenterApi } from '../../api/adminServiceCenterApi';

import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  name: commonValidations.alphaNumeric('Service Center Name'),
  gstNumber: commonValidations.gstNumber,
  contactNumber: commonValidations.mobile,
  email: commonValidations.email,
  logoUrl: commonValidations.optionalUrl,
  websiteUrl: commonValidations.optionalUrl,
  tax: commonValidations.taxNumber,
});

export default function ServiceCenterForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      gstNumber: '',
      contactNumber: '',
      email: '',
      logoUrl: '',
      websiteUrl: '',
      tax: '',
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (isEdit) {
      const fetchDetail = async () => {
        try {
          const res = await getServiceCenterApi(id);
          if (res?.success) {
            const sc = res.data.serviceCenter || res.data;
            reset({
              name: sc.serviceCenterName || '',
              gstNumber: sc.gstNumber || '',
              contactNumber: sc.contactPhone || '',
              email: sc.contactEmail || '',
              logoUrl: sc.logoUrl || '',
              websiteUrl: sc.websiteUrl || '',
              tax: sc.tax || '',
            });
          }
        } catch (error) {
          toastError('Failed to fetch service center details');
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [isEdit, id, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        serviceCenterName: data.name,
        gstNumber: data.gstNumber,
        contactPhone: data.contactNumber,
        contactEmail: data.email,
        logoUrl: data.logoUrl,
        websiteUrl: data.websiteUrl,
        tax: data.tax,
      };
      if (isEdit) {
        await updateServiceCenterApi(id, payload);
        toastSuccess(`Service Center "${data.name}" updated successfully.`);
      } else {
        await createServiceCenterApi(payload);
        toastSuccess(`Service Center "${data.name}" created successfully.`);
      }
      navigate(ROUTES.ADMIN_SERVICE_CENTERS);
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to save service center');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit' : 'Add'} Service Center
        </Typography>
        <BackButton
          to={ROUTES.ADMIN_SERVICE_CENTERS}
          label="Back to Service Centers"
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
                  label="Service Center Name"
                  placeholder="e.g. DVSOS Main Branch"
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="contactNumber"
                  label="Contact Number"
                  placeholder="e.g. 9876543210"
                  required
                  inputProps={{ maxLength: 10, pattern: '[0-9]*' }}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="email"
                  label="Email Address"
                  placeholder="e.g. contact@dvsos.com"
                  type="email"
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="gstNumber"
                  label="GST Number"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="logoUrl"
                  label="Logo URL"
                  placeholder="e.g. https://example.com/logo.png"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="websiteUrl"
                  label="Website URL"
                  placeholder="e.g. https://www.dvsos.com"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="tax"
                  label="Tax (%)"
                  placeholder="e.g. 18"
                  required
                  inputProps={{ maxLength: 3 }}
                  onInput={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, '');
                    if (val.split('.').length > 2) {
                      val = val.replace(/\.+$/, '');
                    }
                    e.target.value = val;
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_SERVICE_CENTERS)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={saving}
              >
                {isEdit ? 'Save Changes' : 'Create Service Center'}
              </Button>
            </Box>
          </form>
        </FormProvider>
      )}
    </Box>
  );
}
