import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSwitch from '../../components/form/RHFSwitch';
import Button from '../../components/common/Button';
import { toastSuccess, toastError } from '../../notifications/toast';
import {
  createServiceCenterApi,
  updateServiceCenterApi,
  getServiceCenterApi,
} from '../../api/adminServiceCenterApi';
import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  name: commonValidations.alphaNumeric('Service Center Name'),
  gstNumber: commonValidations.gstNumber,
  contactNumber: commonValidations.mobile,
  email: commonValidations.email,
  logoUrl: commonValidations.optionalUrl,
  websiteUrl: commonValidations.optionalUrl,
  tax: commonValidations.taxNumber,
  isActive: z.boolean().default(true),
});

export default function ServiceCenterModal({
  open,
  onClose,
  serviceCenterId = null,
  onSuccess,
}) {
  const isEdit = !!serviceCenterId;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      isActive: true,
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        const fetchDetail = async () => {
          setLoading(true);
          try {
            const res = await getServiceCenterApi(serviceCenterId);
            if (res?.success) {
              const sc = res.data.serviceCenter || res.data;
              reset({
                name: sc.serviceCenterName || '',
                gstNumber: sc.gstNumber || '',
                contactNumber: sc.contactPhone || '',
                email: sc.contactEmail || '',
                logoUrl: sc.logoUrl || '',
                websiteUrl: sc.websiteUrl || '',
                tax: sc.tax !== undefined && sc.tax !== null ? String(sc.tax) : '',
                isActive: sc.isActive !== false,
              });
            }
          } catch (error) {
            toastError('Failed to fetch service center details');
            onClose();
          } finally {
            setLoading(false);
          }
        };
        fetchDetail();
      } else {
        reset({
          name: '',
          gstNumber: '',
          contactNumber: '',
          email: '',
          logoUrl: '',
          websiteUrl: '',
          tax: '',
          isActive: true,
        });
      }
    }
  }, [open, isEdit, serviceCenterId, reset, onClose]);

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
        isActive: data.isActive,
      };

      let response;
      if (isEdit) {
        response = await updateServiceCenterApi(serviceCenterId, payload);
        toastSuccess(`Service Center "${data.name}" updated successfully.`);
      } else {
        response = await createServiceCenterApi(payload);
        toastSuccess(`Service Center "${data.name}" created successfully.`);
      }

      const savedItem = response?.data?.serviceCenter || response?.data || { id: serviceCenterId, serviceCenterName: data.name };
      if (onSuccess) {
        onSuccess(savedItem, isEdit);
      }
      onClose();
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to save service center');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          {isEdit ? 'Edit Service Center' : 'Add Service Center'}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={saving}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <FormProvider {...methods}>
            <form id="service-center-modal-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Grid container spacing={3}>
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

                <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', pt: { md: 4 } }}>
                  <RHFSwitch
                    name="isActive"
                    label="Active Status"
                    hint="Enable or disable this service center"
                  />
                </Grid>
              </Grid>
            </form>
          </FormProvider>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          form="service-center-modal-form"
          isLoading={saving}
          disabled={loading}
        >
          {isEdit ? 'Save Changes' : 'Create Service Center'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
