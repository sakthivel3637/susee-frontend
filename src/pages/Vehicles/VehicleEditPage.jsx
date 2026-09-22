import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Box, Card, Grid, Typography } from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSelect from '../../components/form/RHFSelect';
import Loader from '../../components/common/Loader';
import { toastSuccess } from '../../notifications/toast';
import { useVehicle, useBrandDropdown } from '../../queries/useDataQueries';
import { useUpdateVehicle } from '../../mutations/useDataMutations';
import { ROUTES } from '../../config/routes';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { commonValidations } from '../../validations/commonSchema';

const schema = z.object({
  vehicleNumber: commonValidations.vehicleNumber,
  brand: commonValidations.requiredUnionId('Brand'),
  makeModel: commonValidations.alphaNumeric('Model', 50),
  type: commonValidations.optionalString,
  fuelType: commonValidations.alphaNumeric('Fuel Type'),
  status: commonValidations.requiredString('Status'),
  ownerName: commonValidations.lettersOnly('Owner Name', 50),
  mobile: commonValidations.mobile,
});

export default function VehicleEditPage() {
  const { slug, id } = useParams();
  const identifier = slug || id;
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(identifier);
  const { data: brandsResponse, isLoading: isBrandsLoading } = useBrandDropdown();

  const brandOptions = brandsResponse?.brands?.map(b => ({ value: b.id, label: b.name })) || [];

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleNumber: '',
      ownerName: '',
      mobile: '',
      brand: '',
      makeModel: '',
      status: '',
      type: '',
      fuelType: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  useEffect(() => {
    if (vehicle) {
      reset({
        vehicleNumber: vehicle.registrationNo || vehicle.vehicleNumber || '',
        ownerName: vehicle.customer?.fullName || vehicle.ownerName || '',
        mobile: vehicle.customer?.mobileNo || vehicle.mobile || '',
        brand: vehicle.brandId || '',
        makeModel: vehicle.model || vehicle.makeModel || '',
        status: vehicle.isActive === false ? 'INACTIVE' : 'ACTIVE',
        type: vehicle.variant || vehicle.type || '',
        fuelType: vehicle.fuelType || '',
      });
    }
  }, [reset, vehicle]);

  const updateVehicleMutation = useUpdateVehicle(identifier);

  if (isLoading) return <Loader text="Loading vehicle..." />;

  const onSubmit = (data) => {
    updateVehicleMutation.mutate(data, {
      onSuccess: () => {
        navigate(ROUTES.VEHICLES);
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Edit Vehicle"
        breadcrumbs={[{ label: 'Vehicles', path: ROUTES.VEHICLES }, { label: 'Edit' }]}
        actions={
          <Box
            component="button"
            onClick={() => navigate(ROUTES.VEHICLES)}
            className="back-btn"
          >
            <ArrowLeft size={16} /> Back to List
          </Box>
        }
      />

      <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3 }}>Vehicle Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="vehicleNumber"
                  label="Registration Number"
                  required
                  onInput={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFSelect name="brand" label="Brand" options={brandOptions} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField name="makeModel" label="Model" required />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField name="type" label="Vehicle Type" placeholder="Enter vehicle type" />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField name="fuelType" label="Fuel Type" placeholder="Enter fuel type" required />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFSelect name="status" label="Status" options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' }
                ]} required />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 4, mb: 3 }}>Owner Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <RHFTextField name="ownerName" label="Owner Name" required />
              </Grid>
              <Grid item xs={12} md={6}>
                <RHFTextField
                  name="mobile"
                  label="Mobile Number"
                  required
                  inputProps={{ maxLength: 10 }}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4 }}>
              <Button variant="secondary" onClick={() => navigate(ROUTES.VEHICLES)}>Cancel</Button>
              <Button variant="primary" leftIcon={Save} type="submit" isLoading={isSubmitting || updateVehicleMutation.isPending}>Save Changes</Button>
            </Box>
          </form>
        </FormProvider>
      </Card>
    </Box>
  );
}
