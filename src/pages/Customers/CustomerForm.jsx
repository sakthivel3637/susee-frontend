import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { Box, Grid, Typography } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import RHFTextField from '../../components/form/RHFTextField';
import RHFTextarea from '../../components/form/RHFTextarea';
import RHFSelect from '../../components/form/RHFSelect';
import Button from '../../components/common/Button';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';


import { useCustomerDetails } from '../../queries/useDataQueries';
import { useUpdateCustomer } from '../../mutations/useDataMutations';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  fullName: commonValidations.requiredString('Customer Full Name', 50),
  emailId: commonValidations.optionalEmail,
  mobileNo: commonValidations.mobile,
  alternateMobileNo: commonValidations.optionalMobile,
  address: commonValidations.requiredString('Billing Address', 200)
});

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id, slug } = useParams();
  const identifier = slug || id;
  const isEdit = !!identifier;

  const { data: customerDetails, isLoading } = useCustomerDetails(identifier);
  const updateMutation = useUpdateCustomer();

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      emailId: '',
      mobileNo: '',
      alternateMobileNo: '',
      address: ''
    }
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    if (isEdit && customerDetails?.data) {
      const customer = customerDetails.data;
      reset({
        fullName: customer.fullName || '',
        emailId: customer.emailId || '',
        mobileNo: customer.mobileNo || '',
        alternateMobileNo: customer.alternateMobileNo || '',
        address: customer.address || ''
      });
    }
  }, [isEdit, customerDetails, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: identifier,
          data: {
            fullName: data.fullName,
            emailId: data.emailId,
            mobileNo: data.mobileNo,
            alternateMobileNo: data.alternateMobileNo,
            address: data.address
          }
        });
      } else {
        toastSuccess('Customer creation is managed via Gate Entry and CRM.');
      }
      navigate(ROUTES.CUSTOMERS || '/customers');
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || error?.message || 'An error occurred while updating the customer';
      toastError(message);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit Customer' : 'Add New Customer'}
        </Typography>
        <Box
          component="button"
          onClick={() => navigate(ROUTES.CUSTOMERS)}
          className="back-btn"
        >
          <ArrowLeft size={16} /> Back to List
        </Box>
      </Box>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Customer Information
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <RHFTextField name="fullName" label="Customer Full Name" placeholder="Enter full name" required />
            </Grid>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="emailId"
                label="Email Address"
                type="email"
                placeholder="Enter email address"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="mobileNo"
                label="Mobile Number"
                placeholder="Enter mobile number"
                required
                inputProps={{ maxLength: 10 }}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <RHFTextField
                name="alternateMobileNo"
                label="Alternative Mobile Number"
                placeholder="Enter alternative mobile number"
                inputProps={{ maxLength: 10 }}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <RHFTextarea name="address" label="Billing Address" placeholder="Enter address details" rows={3} required />
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="secondary" type="button" onClick={() => navigate(ROUTES.CUSTOMERS)} > Cancel </Button>
            <Button variant="primary" type="submit" isLoading={updateMutation.isPending} > {isEdit ? 'Save Changes' : 'Submit'} </Button>
          </Box>
        </form>
      </FormProvider>
    </Box>
  );
}
