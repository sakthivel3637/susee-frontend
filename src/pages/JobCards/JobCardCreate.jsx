import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, Typography, Divider, Card, CardContent, Checkbox, FormControlLabel, IconButton, Chip, TextField, MenuItem } from '@mui/material';
import { Save, Search, MessageCircle, ArrowLeft, X, Plus, UserPlus } from 'lucide-react';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import Modal from '../../components/common/Modal';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSelect from '../../components/form/RHFSelect';
import RHFTextarea from '../../components/form/RHFTextarea';
import { toastSuccess, toastError, toastInfo } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/formatters';
import { useState, useMemo, useEffect, useCallback } from 'react';
import useMasterDataStore from '../../store/useMasterDataStore';
import { useJobCard } from '../../queries/useDataQueries';
import useAuthStore from '../../store/useAuthStore';
import { getJobCardServiceStatusesApi, updateJobCardApi } from '../../api/jobCardApi';
import { assignQueueWorkApi, reassignQueueWorkApi } from '../../api/queueApi';
import { getMechanicsDropdownApi } from '../../api/userApi';
import { adminBayApi } from '../../api/adminBayApi';
import { getDepartmentFromModules, hasReadableModule } from '../../utils/authAccess';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Loader from '../../components/common/Loader';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const BAY_TYPE_BY_CATEGORY = {
  mechanical: 'Mechanical',
  'body-shop': 'Body Shop',
  'water-wash': 'Water Wash'
};

export default function JobCardCreate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id, slug } = useParams();
  const jobCardIdentifier = slug || id;
  const isEditMode = !!jobCardIdentifier;
  const { data: jobCard, isLoading: isJobCardLoading } = useJobCard(jobCardIdentifier);
  const { masterServices, serviceCategories, companySettings } = useMasterDataStore();
  const [selectedServices, setSelectedServices] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customService, setCustomService] = useState({ name: '', price: '' });
  const [serviceStatusOptions, setServiceStatusOptions] = useState([]);
  const [serviceStatusValues, setServiceStatusValues] = useState({});
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignUser, setSelectedAssignUser] = useState('');
  const [selectedAssignBay, setSelectedAssignBay] = useState('');

  const { menus, user } = useAuthStore();
  const locationId = user?.locationId || user?.location_id || user?.branchId || '';
  const moduleDepartment = getDepartmentFromModules(menus);
  const roleCategoryMap = {
    mechanical: 'Mechanical',
    'body-shop': 'Body Shop',
    'water-wash': 'Water Wash',
  };
  const restrictedCategory = roleCategoryMap[moduleDepartment];

  const methods = useForm({
    defaultValues: {
      vehicleId: '',
      vehicleNumber: '',
      ownerName: '',
      ownerMobile: '',
      makeModel: '',
      serviceType: '',
      priority: 'NORMAL',
      estimatedCost: '',
      technician: '',
      notes: '',
      deliveryDate: '',
      services: [],
    },
  });

  const { handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = methods;

  const selectedCategory = watch('serviceType');
  const assignmentDetails = useMemo(() => jobCard?.workAssignments || [], [jobCard]);
  const hasAdditionalDetails = useMemo(() => {
    if (!isEditMode) return true;

    return Boolean(String(
      jobCard?.notes
      || jobCard?.customerComplaint
      || jobCard?.additionalNotes
      || ''
    ).trim());
  }, [isEditMode, jobCard]);

  const filteredServices = useMemo(() => {
    let categoryToFilter = selectedCategory;
    if (restrictedCategory && (!selectedCategory || selectedCategory === 'ALL')) {
      categoryToFilter = restrictedCategory;
    }

    if (!categoryToFilter || categoryToFilter === 'ALL') return masterServices;
    return masterServices.filter(s => s.category?.toLowerCase() === categoryToFilter.toLowerCase());
  }, [masterServices, selectedCategory, restrictedCategory]);

  useEffect(() => {
    if (!isEditMode && restrictedCategory) {
      setValue('serviceType', restrictedCategory);
    }
  }, [isEditMode, restrictedCategory, setValue]);

  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;

    const fetchJobCardServiceStatuses = async () => {
      try {
        const serviceStatusResponse = await getJobCardServiceStatusesApi();
        const serviceStatuses = serviceStatusResponse?.data || [];

        if (!isMounted) return;

        setServiceStatusOptions(serviceStatuses.map((status) => ({
          value: String(status.id),
          label: status.statusName || status.statusCode,
          code: status.statusCode
        })));
      } catch (error) {
        if (isMounted) {
          toastError(error?.message || 'Failed to fetch job card statuses.');
        }
      }
    };

    fetchJobCardServiceStatuses();

    return () => {
      isMounted = false;
    };
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode && jobCard) {
      const vehicle = jobCard.vehicle || {};
      const customer = jobCard.customer || {};
      const services = jobCard.services || [];
      const firstCategory = services[0]?.serviceItem?.category?.name || services[0]?.category || '';

      setValue('vehicleNumber', jobCard.vehicleNumber || vehicle.registrationNo || vehicle.registrationNumber || '');
      setValue('ownerName', jobCard.ownerName || customer.fullName || customer.name || '');
      setValue('ownerMobile', jobCard.ownerMobile || jobCard.mobile || customer.mobileNo || '');
      setValue('makeModel', jobCard.makeModel || [vehicle.brand?.name, vehicle.model].filter(Boolean).join(' ') || vehicle.model || '');
      setValue('serviceType', jobCard.serviceType || firstCategory || '');
      setValue('priority', jobCard.priority || 'NORMAL');
      setValue('estimatedCost', jobCard.estimatedCost || jobCard.finalAmount || jobCard.totalEstimate || '');
      setValue('technician', jobCard.technician || '');
      setValue('notes', jobCard.notes || jobCard.customerComplaint || jobCard.additionalNotes || '');
      if (jobCard.expectedDeliveryAt || jobCard.createdAt) {
        const date = new Date(jobCard.expectedDeliveryAt || jobCard.createdAt);
        const formattedDate = formatDate(date, 'dd - MM - yyyy hh:mm a');
        setValue('deliveryDate', formattedDate);
      }

      if (services.length > 0 && typeof services[0] === 'object') {
        const mappedServices = services.map((service) => ({
          id: service.serviceItemId || service.serviceItem?.id || service.id,
          jobCardServiceId: service.id,
          serviceItemId: service.serviceItemId || service.serviceItem?.id || service.id,
          name: service.serviceName || service.name || service.serviceItem?.name,
          estimateMinutes: service.serviceItem?.estimatedMinutes || service.estimateMinutes || null,
          price: Number(service.price || service.serviceItem?.defaultPrice || 0),
          quantity: service.quantity || 1,
          category: service.serviceItem?.category?.name || firstCategory || 'Mechanical',
          serviceStatusId: service.serviceStatusId || service.serviceStatus?.id || '',
          serviceStatusCode: service.serviceStatus?.statusCode || service.serviceStatus?.code || ''
        }));
        setSelectedServices(mappedServices);
        setValue('services', mappedServices.map(s => s.serviceItemId || s.id));
        setServiceStatusValues(
          mappedServices.reduce((acc, service) => {
            if (service.jobCardServiceId) {
              acc[service.jobCardServiceId] = service.serviceStatusId ? String(service.serviceStatusId) : '';
            }
            return acc;
          }, {})
        );
      } else if (jobCard.services && masterServices.length > 0) {
        const mappedServices = masterServices.filter(s =>
          jobCard.services.includes(s.name) || jobCard.services.includes(s.id)
        );
        setSelectedServices(mappedServices);
        setValue('services', mappedServices.map(s => s.id));
      }
    }
  }, [jobCard, isEditMode, setValue, masterServices]);

  const isServiceRejectedOrCancelled = useCallback((service) => {
    const statusId = service.jobCardServiceId ? serviceStatusValues[service.jobCardServiceId] : null;
    if (statusId) {
      const currentStatus = serviceStatusOptions.find((status) => String(status.value) === String(statusId));
      const code = String(currentStatus?.code || '').trim().toUpperCase();
      if (code === 'REJECTED' || code === 'CANCELLED') return true;
    }
    const fallbackCode = String(service?.serviceStatusCode || '').trim().toUpperCase();
    return fallbackCode === 'REJECTED' || fallbackCode === 'CANCELLED';
  }, [serviceStatusValues, serviceStatusOptions]);

  const activeBillServices = useMemo(() => {
    return selectedServices.filter((service) => !isServiceRejectedOrCancelled(service));
  }, [selectedServices, isServiceRejectedOrCancelled]);

  const subtotal = useMemo(() => activeBillServices.reduce((sum, s) => sum + s.price, 0), [activeBillServices]);

  const CATEGORY_OPTS = useMemo(() => {
    let categories = serviceCategories;
    if (restrictedCategory) {
      categories = serviceCategories.filter(c => c.name === restrictedCategory);
    }

    if (restrictedCategory) {
      return categories.map(c => ({ value: c.name, label: c.name }));
    }

    return [
      { value: 'ALL', label: 'All Categories' },
      ...categories.map(c => ({ value: c.name, label: c.name }))
    ];
  }, [serviceCategories, restrictedCategory]);

  const getAssignmentStatusCode = (assignment) => {
    return String(assignment?.status?.statusCode || assignment?.status?.code || '').toUpperCase();
  };

  const getAssignmentStatusValue = (assignment) => {
    const statusCode = getAssignmentStatusCode(assignment);
    if (statusCode.includes('COMPLETED')) return 'COMPLETED';
    if (statusCode.includes('IN_PROGRESS')) return 'IN_PROGRESS';
    return 'ASSIGNED';
  };

  const getAssignmentStatusLabel = (assignment) => {
    const statusValue = getAssignmentStatusValue(assignment);
    if (statusValue === 'COMPLETED') return 'Completed';
    if (statusValue === 'IN_PROGRESS') return 'In Progress';
    return 'Assigned';
  };

  const getAssignmentStatusColor = (assignment) => {
    const statusValue = getAssignmentStatusValue(assignment);
    if (statusValue === 'COMPLETED') return 'success';
    if (statusValue === 'IN_PROGRESS') return 'info';
    return 'warning';
  };

  const normalizeDepartment = (value) => String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-');

  const getServiceDepartment = (service) => {
    const normalized = normalizeDepartment(service?.category || service?.serviceItem?.category?.name || service?.serviceItem?.category?.slug);
    if (['mechanical', 'mechanic', 'mechnanic', 'floor'].includes(normalized)) return 'mechanical';
    if (['body-shop', 'bodyshop', 'paint', 'denting'].includes(normalized)) return 'body-shop';
    if (['water-wash', 'wash'].includes(normalized)) return 'water-wash';
    return '';
  };

  const getRoleDepartment = () => {
    if (hasReadableModule(menus, ['admin', 'manager', 'managing-director'])) return 'all';
    if (moduleDepartment) return moduleDepartment;
    return '';
  };

  const getServiceStatusCode = (service) => {
    const currentStatus = serviceStatusOptions.find((status) => status.value === String(service.serviceStatusId || ''));
    return String(currentStatus?.code || service?.serviceStatusCode || '').trim().toUpperCase();
  };

  const isServiceCompleted = (service) => {
    const code = getServiceStatusCode(service);
    return ['COMPLETED', 'REJECTED', 'CANCELLED'].some((status) => code.includes(status));
  };

  const isServiceCompletedOrPostponed = (service) => {
    const code = getServiceStatusCode(service);
    return ['COMPLETED', 'POSTPONED', 'REJECTED', 'CANCELLED'].some((status) => code.includes(status));
  };

  const arePreviousDepartmentsCompleted = (department) => {
    const order = ['mechanical', 'body-shop', 'water-wash'];
    const departmentIndex = order.indexOf(department);
    const previousDepartments = order.slice(0, departmentIndex);

    return previousDepartments.every((previousDepartment) => {
      const services = selectedServices.filter((service) => getServiceDepartment(service) === previousDepartment);
      return services.length === 0 || services.every(isServiceCompletedOrPostponed);
    });
  };

  const canEditServiceStatus = (service) => {
    const roleDepartment = getRoleDepartment();
    if (roleDepartment === 'all') return true;

    const serviceDepartment = getServiceDepartment(service);
    return Boolean(roleDepartment)
      && roleDepartment === serviceDepartment
      && arePreviousDepartmentsCompleted(serviceDepartment)
      && !isServiceCompleted(service);
  };

  const getAssignmentDepartment = (assignment) => {
    const category = assignment?.jobCardService?.serviceItem?.category || assignment?.service?.category;
    const normalized = normalizeDepartment(category?.slug || category?.name);
    if (['mechanical', 'mechanic', 'mechnanic', 'floor'].includes(normalized)) return 'mechanical';
    if (['body-shop', 'bodyshop', 'paint', 'denting'].includes(normalized)) return 'body-shop';
    if (['water-wash', 'wash'].includes(normalized)) return 'water-wash';
    return '';
  };

  const activeAssignmentDetails = useMemo(() => {
    return assignmentDetails.filter((assignment) => !assignment.completedAt);
  }, [assignmentDetails]);

  const assignmentCategory = useMemo(() => {
    const isRestricted = !hasReadableModule(menus, ['admin', 'manager', 'managing-director']);
    if (isRestricted && moduleDepartment) {
      return moduleDepartment;
    }

    const activeAssignmentCategory = activeAssignmentDetails.map(getAssignmentDepartment).find(Boolean);
    if (activeAssignmentCategory) return activeAssignmentCategory;

    const selectedServiceCategory = selectedServices.map(getServiceDepartment).find(Boolean);
    if (selectedServiceCategory) return selectedServiceCategory;

    if (moduleDepartment) return moduleDepartment;
    return 'mechanical';
  }, [activeAssignmentDetails, selectedServices, moduleDepartment, menus]);

  const canReassignExistingWork = activeAssignmentDetails.some((assignment) => getAssignmentDepartment(assignment) === assignmentCategory);
  const assignButtonLabel = canReassignExistingWork ? 'Reassign Mechanic & Bay' : 'Assign Mechanic & Bay';

  const { data: mechanicsResponse, isLoading: isMechanicsLoading } = useQuery({
    queryKey: ['job-card-edit-mechanics', locationId, assignmentCategory],
    queryFn: () => getMechanicsDropdownApi({ locationId, category: assignmentCategory }),
    enabled: isEditMode && assignModalOpen,
    staleTime: 60000
  });

  const { data: baysResponse, isLoading: isBaysLoading } = useQuery({
    queryKey: ['job-card-edit-bays', locationId, assignmentCategory],
    queryFn: () => adminBayApi.getBayDropdown({
      locationId,
      bayType: BAY_TYPE_BY_CATEGORY[assignmentCategory]
    }),
    enabled: isEditMode && assignModalOpen,
    staleTime: 30000
  });

  const mechanics = mechanicsResponse?.data?.users || mechanicsResponse?.users || [];
  const bays = baysResponse?.data?.bays || baysResponse?.data?.data?.bays || baysResponse?.bays || [];
  const selectedBayItem = bays.find((bay) => String(bay.id) === String(selectedAssignBay));

  const assignMutation = useMutation({
    mutationFn: ({ payload, isReassign }) => {
      return isReassign
        ? reassignQueueWorkApi(jobCard?.id, payload)
        : assignQueueWorkApi(jobCard?.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['job-cards', jobCardIdentifier] });
      await queryClient.invalidateQueries({ queryKey: ['job-card-edit-bays'] });
      setAssignModalOpen(false);
      setSelectedAssignUser('');
      setSelectedAssignBay('');
      toastSuccess(canReassignExistingWork ? 'Mechanic and bay reassigned successfully.' : 'Mechanic and bay assigned successfully.');
    },
    onError: (error) => {
      toastError(error?.message || 'Failed to update mechanic and bay assignment.');
    }
  });

  const openAssignModal = () => {
    const firstActiveAssignment = activeAssignmentDetails.find((assignment) => getAssignmentDepartment(assignment) === assignmentCategory);
    setSelectedAssignUser(firstActiveAssignment?.assignedUser?.id || firstActiveAssignment?.assignedUserId || '');
    setSelectedAssignBay(firstActiveAssignment?.bay?.id || firstActiveAssignment?.bayId || '');
    setAssignModalOpen(true);
  };

  const handleAssignMechanicBay = () => {
    if (!selectedAssignUser) {
      toastInfo('Please select a mechanic');
      return;
    }

    if (!selectedAssignBay) {
      toastInfo('Please select a bay');
      return;
    }

    const bayBusyByOtherJob = selectedBayItem?.availability === 'BUSY'
      && !activeAssignmentDetails.some((assignment) => String(assignment.bayId || assignment.bay?.id) === String(selectedAssignBay));

    if (bayBusyByOtherJob) {
      toastError('Selected bay is already busy');
      return;
    }

    assignMutation.mutate({
      isReassign: canReassignExistingWork,
      payload: {
        assignedUserId: Number(selectedAssignUser),
        bayId: Number(selectedAssignBay),
        category: assignmentCategory
      }
    });
  };

  if (isEditMode && isJobCardLoading) {
    return <Loader text="Loading job card details..." />;
  }

  const vehicleNumber = watch('vehicleNumber');

  const getServiceKey = (service) => {
    const serviceId = service?.serviceItemId || service?.id;
    return serviceId ? `id:${serviceId}` : `name:${String(service?.name || service?.serviceName || '').trim().toLowerCase()}`;
  };

  const isServiceSelected = (service) => {
    const serviceKey = getServiceKey(service);
    const serviceName = String(service?.name || service?.serviceName || '').trim().toLowerCase();

    return selectedServices.some((selectedService) => {
      return getServiceKey(selectedService) === serviceKey
        || String(selectedService?.name || selectedService?.serviceName || '').trim().toLowerCase() === serviceName;
    });
  };

  const toggleService = (service) => {
    if (isEditMode) return;

    let updated;
    if (isServiceSelected(service)) {
      const serviceKey = getServiceKey(service);
      const serviceName = String(service?.name || service?.serviceName || '').trim().toLowerCase();
      updated = selectedServices.filter((selectedService) => {
        return getServiceKey(selectedService) !== serviceKey
          && String(selectedService?.name || selectedService?.serviceName || '').trim().toLowerCase() !== serviceName;
      });
    } else {
      updated = [...selectedServices, service];
    }
    setSelectedServices(updated);
    setValue('services', updated.map((s) => s.serviceItemId || s.id));

    const totalCost = updated.reduce((sum, s) => sum + s.price, 0);
    const tax = totalCost * (companySettings.defaultTaxRate / 100);
    setValue('estimatedCost', totalCost + tax);
  };

  const handleSearchVehicle = async () => {
    if (!vehicleNumber || vehicleNumber.length < 4) {
      toastError('Please enter a valid registration number');
      return;
    }
    setIsSearching(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setValue('ownerName', 'Rajesh Kumar');
      setValue('ownerMobile', '9876543210');
      setValue('makeModel', 'Hyundai Creta');
      toastSuccess('Vehicle details fetched from service history!');
    } catch (err) {
      toastError('Could not fetch vehicle details');
    } finally {
      setIsSearching(false);
    }
  };

  const billSubtotal = subtotal;
  const billTaxRate = isEditMode
    ? Number(jobCard?.taxRate ?? jobCard?.billing?.taxRate ?? companySettings.defaultTaxRate ?? 0)
    : Number(companySettings.defaultTaxRate ?? 0);
  const billDiscountAmount = isEditMode
    ? Number(jobCard?.discountAmount ?? jobCard?.billing?.discountAmount ?? 0)
    : 0;
  const taxableAmount = Math.max(0, billSubtotal - billDiscountAmount);
  const billTaxAmount = (taxableAmount * (billTaxRate / 100));
  const grandTotal = taxableAmount + billTaxAmount;

  const handleWhatsAppApproval = async () => {
    if (selectedServices.length === 0) {
      toastError('Please select at least one service');
      return;
    }
    if (!watch('ownerMobile')) {
      toastError('Please enter customer mobile number');
      return;
    }

    try {
      toastInfo('Generating WhatsApp approval link...');
      await new Promise((r) => setTimeout(r, 1000));
      const message = `Hello ${watch('ownerName') || 'Customer'}, your vehicle service estimate is ready. Grand Total: ${formatCurrency(grandTotal)}. Please reply YES to approve work.`;
      window.open(`https://wa.me/91${watch('ownerMobile')}?text=${encodeURIComponent(message)}`, '_blank');
      toastSuccess('Bill sent via WhatsApp successfully!');
    } catch (err) {
      toastError('Failed to send WhatsApp message');
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateJobCardApi(jobCardIdentifier, {
          serviceStatuses: selectedServices
            .filter((service) => canEditServiceStatus(service) && service.jobCardServiceId && serviceStatusValues[service.jobCardServiceId])
            .map((service) => ({
              jobCardServiceId: service.jobCardServiceId,
              statusId: Number(serviceStatusValues[service.jobCardServiceId])
            }))
        });
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      await queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      toastSuccess(isEditMode ? 'Job Card updated successfully!' : 'Job Card created successfully!');
      navigate(ROUTES.JOB_CARDS);
    } catch (error) {
      toastError(error?.message || (isEditMode ? 'Failed to update Job Card.' : 'Failed to create Job Card.'));
    }
  };

  const handleServiceStatusChange = (service, statusId) => {
    const jobCardServiceId = service.jobCardServiceId;
    const selectedStatus = serviceStatusOptions.find(s => String(s.value) === String(statusId));
    const statusCode = selectedStatus?.code?.toUpperCase() || '';

    const progressingStatuses = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
    const isProgressingStatus = progressingStatuses.some(status => statusCode.includes(status));

    if (isProgressingStatus) {
      const serviceDept = getServiceDepartment(service);
      const hasAnyAssignment = assignmentDetails.some(a => getAssignmentDepartment(a) === serviceDept);

      if (!hasAnyAssignment) {
        toastError(`Please assign a mechanic and bay for ${serviceDept || 'this department'} services first.`);
        return;
      }
    }

    setServiceStatusValues((current) => ({
      ...current,
      [jobCardServiceId]: statusId
    }));
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', p: { xs: 2, md: 4 } }}>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEditMode ? 'Edit Job Card' : 'Create Job Card'}
        </Typography>
        <BackButton
          to={ROUTES.JOB_CARDS}
          label="Back to List"
        />
      </Box>

      <FormProvider {...methods}>
        <form id="jobCardForm" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={4}>
            {/* LEFT COLUMN: FORM */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: 3, boxShadow: 0, p: 3, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
                  Vehicle & Customer Information
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <RHFTextField name="vehicleNumber" label="Registration Number" placeholder="TN 01 AB 1234" required readOnly={isEditMode} />
                      </Box>
                      {!isEditMode && (
                        <Button
                          type="button"
                          variant="secondary"
                          leftIcon={Search}
                          isLoading={isSearching}
                          onClick={handleSearchVehicle}
                          style={{ height: '40px' }}
                        >
                          Search
                        </Button>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <RHFTextField name="makeModel" label="Brand & Model" placeholder="e.g. Hyundai Creta" required readOnly={isEditMode} />
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <RHFTextField name="ownerName" label="Owner Name" placeholder="Full name" required readOnly={isEditMode} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <RHFTextField name="ownerMobile" label="Mobile Number" placeholder="10-digit mobile" required readOnly={isEditMode} />
                  </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 0 }}>
                  <Grid item xs={12} md={6}>
                    <RHFTextField name="deliveryDate" label="Expected Delivery" type={isEditMode ? 'text' : 'datetime-local'} required readOnly={isEditMode} />
                  </Grid>
                  {isEditMode && !hasReadableModule(menus, ['manager', 'managing-director']) && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 600 }}>
                        Mechanic & Bay
                      </Typography>
                      <Button
                        type="button"
                        variant="secondary"
                        leftIcon={UserPlus}
                        onClick={openAssignModal}
                        fullWidth
                      >
                        {assignButtonLabel}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Card>

              <Card sx={{ borderRadius: 3, boxShadow: 0, p: 3, mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
                  Service Configuration & Master List
                </Typography>

                {!isEditMode && (
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <RHFSelect name="serviceType" label="Primary Category" options={CATEGORY_OPTS} placeholder="Select category" required />
                    </Grid>
                  </Grid>
                )}

                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary', textTransform: 'uppercase' }}>
                  {isEditMode ? 'Job Card Services' : 'Available Services'}
                </Typography>

                {isEditMode ? (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1.7fr 0.8fr 0.8fr 1.2fr' },
                        gap: 2,
                        px: 2,
                        py: 1.5,
                        bgcolor: '#F1F5F9'
                      }}
                    >
                      <Typography variant="caption" fontWeight={800} color="text.secondary">SERVICE NAME</Typography>
                      <Typography variant="caption" fontWeight={800} color="text.secondary">ESTIMATE</Typography>
                      <Typography variant="caption" fontWeight={800} color="text.secondary">PRICE</Typography>
                      <Typography variant="caption" fontWeight={800} color="text.secondary">STATUS</Typography>
                    </Box>

                    {selectedServices.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">No services added for this job card.</Typography>
                      </Box>
                    ) : (
                      selectedServices.map((service) => (
                        <Box
                          key={service.jobCardServiceId || service.serviceItemId || service.id}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1.7fr 0.8fr 0.8fr 1.2fr' },
                            gap: 2,
                            alignItems: 'center',
                            px: 2,
                            py: 1.5,
                            borderTop: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{service.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{service.category}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {service.estimateMinutes ? `${service.estimateMinutes} min` : '-'}
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>{formatCurrency(service.price)}</Typography>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={serviceStatusValues[service.jobCardServiceId] || ''}
                            onChange={(event) => handleServiceStatusChange(service, event.target.value)}
                            disabled={!canEditServiceStatus(service)}
                          >
                            <MenuItem value="" disabled>Select status</MenuItem>
                            {serviceStatusOptions.map((status) => (
                              <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      ))
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    {filteredServices.map((service) => {
                      const isSelected = isServiceSelected(service);
                      return (
                        <Box
                          key={service.id}
                          onClick={() => toggleService(service)}
                          sx={{
                            p: 2, borderRadius: 2, border: '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            bgcolor: isSelected ? 'primary.main' : 'background.paper',
                            color: isSelected ? '#FFFFFF' : 'inherit',
                            cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                        >
                          <FormControlLabel
                            control={<Checkbox checked={isSelected} onChange={() => { }} sx={{ p: 0.5, color: isSelected ? '#FFFFFF' : 'inherit', '&.Mui-checked': { color: '#FFFFFF' } }} />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>{service.name}</Typography>
                                <Chip
                                  label={service.category}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    bgcolor: isSelected ? 'rgba(255,255,255,0.2)' : 'action.selected',
                                    color: isSelected ? '#FFF' : 'text.primary',
                                    fontWeight: 600
                                  }}
                                />
                              </Box>
                            }
                            sx={{ m: 0 }}
                          />
                          <Typography variant="body2" fontWeight={700}>{formatCurrency(service.price)}</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Card>

              {isEditMode && (
                <Card sx={{ borderRadius: 3, boxShadow: 0, p: 3, mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Assign Work Details
                    </Typography>
                    <Chip
                      label={`${assignmentDetails.length} Assignment${assignmentDetails.length === 1 ? '' : 's'}`}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {assignmentDetails.length === 0 ? (
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No work assignment added for this job card yet.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {assignmentDetails.map((assignment) => {
                        const assignedUser = assignment.assignedUser || {};
                        const serviceName = assignment.jobCardService?.serviceName || assignment.service?.serviceName || 'Assigned Service';

                        return (
                          <Box
                            key={assignment.id}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              p: 2,
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr auto' },
                              gap: 2,
                              alignItems: 'center'
                            }}
                          >
                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                Assigned User
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {assignedUser.fullName || 'Unassigned'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {serviceName}
                                {assignedUser.employeeCode ? ` - ${assignedUser.employeeCode}` : ''}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                Start Time
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {assignment.startedAt ? formatDateTime(assignment.startedAt) : '-'}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                End Time
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {assignment.completedAt ? formatDateTime(assignment.completedAt) : '-'}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                                Status
                              </Typography>
                              <Chip
                                label={getAssignmentStatusLabel(assignment)}
                                color={getAssignmentStatusColor(assignment)}
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Card>
              )}

              {hasAdditionalDetails && (
                <Card sx={{ borderRadius: 3, boxShadow: 0, p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
                    Additional Details
                  </Typography>
                  <RHFTextarea name="notes" label="Customer Complaints / Notes" rows={3} placeholder="Enter any specific issues reported by customer..." disabled={isEditMode} />
                </Card>
              )}
            </Grid>

            {/* RIGHT COLUMN: BILL PREVIEW */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: 3, boxShadow: 0, position: 'sticky', top: 80 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight={700}>Bill Preview</Typography>
                    <Typography variant="caption" sx={{ bgcolor: 'success.main', color: '#FFFFFF', px: 1, py: 0.5, borderRadius: 8, fontWeight: 600 }}>Auto-generated</Typography>
                  </Box>

                  <Box sx={{ minHeight: 150, maxHeight: 300, overflowY: 'auto', mb: 3 }}>
                    {activeBillServices.length === 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}>
                        <Typography color="text.secondary" variant="body2" fontStyle="italic">No billable services</Typography>
                      </Box>
                    ) : (
                      activeBillServices.map((item) => (
                        <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!isEditMode && (
                              <IconButton size="small" onClick={() => toggleService(item)} sx={{ color: 'error.main', p: 0.5 }}>
                                <X size={16} />
                              </IconButton>
                            )}
                            <Typography variant="body2" fontWeight={500}>{item.name} <Typography component="span" variant="caption" color="text.secondary">x1</Typography></Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600}>{formatCurrency(item.price)}</Typography>
                        </Box>
                      ))
                    )}
                  </Box>

                  <Box sx={{ bgcolor: 'background.default', borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatCurrency(billSubtotal)}</Typography>
                    </Box>
                    {billDiscountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Discount</Typography>
                        <Typography variant="body2" fontWeight={500}>-{formatCurrency(billDiscountAmount)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Tax ({billTaxRate}%)</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatCurrency(billTaxAmount)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">Grand Total</Typography>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">{formatCurrency(grandTotal)}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                    {/* <Button
                      variant="outline"
                      fullWidth
                      leftIcon={MessageCircle}
                      onClick={handleWhatsAppApproval}
                      style={{ borderColor: '#25D366', color: '#25D366' }}
                    >
                      Send via WhatsApp
                    </Button> */}
                    <Button
                      variant="primary"
                      fullWidth
                      leftIcon={Save}
                      form="jobCardForm"
                      type="submit"
                      isLoading={isSubmitting}
                    >
                      {isEditMode ? 'Update Job Card' : 'Create Job Card'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Modal
            show={assignModalOpen}
            onHide={() => {
              setAssignModalOpen(false);
              setSelectedAssignUser('');
              setSelectedAssignBay('');
            }}
            title={assignButtonLabel}
            confirmLabel={canReassignExistingWork ? 'Reassign' : 'Assign'}
            onConfirm={handleAssignMechanicBay}
            isConfirming={assignMutation.isPending}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Mechanic"
                value={selectedAssignUser}
                onChange={(event) => setSelectedAssignUser(event.target.value)}
                disabled={isMechanicsLoading || assignMutation.isPending}
              >
                <MenuItem value="" disabled>
                  {isMechanicsLoading ? 'Loading mechanics...' : 'Select mechanic'}
                </MenuItem>
                {mechanics.map((mechanic) => (
                  <MenuItem key={mechanic.id} value={mechanic.id}>
                    {mechanic.fullName}
                    {mechanic.employeeCode ? ` - ${mechanic.employeeCode}` : ''}
                    {mechanic.availabilityLabel ? ` (${mechanic.availabilityLabel})` : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Bay"
                value={selectedAssignBay}
                onChange={(event) => setSelectedAssignBay(event.target.value)}
                disabled={isBaysLoading || assignMutation.isPending}
              >
                <MenuItem value="" disabled>
                  {isBaysLoading ? 'Loading bays...' : 'Select bay'}
                </MenuItem>
                {bays.map((bay) => {
                  const isCurrentJobBay = activeAssignmentDetails.some((assignment) => String(assignment.bayId || assignment.bay?.id) === String(bay.id));
                  const isBusy = bay.availability === 'BUSY' && !isCurrentJobBay;
                  return (
                    <MenuItem key={bay.id} value={bay.id} disabled={isBusy}>
                      {bay.bayName || bay.bayCode}
                      {bay.bayCode && bay.bayName ? ` - ${bay.bayCode}` : ''}
                      {isCurrentJobBay ? ' (Current)' : bay.availabilityLabel ? ` (${bay.availabilityLabel})` : ''}
                    </MenuItem>
                  );
                })}
              </TextField>

              <Typography variant="caption" color="text.secondary">
                Category: {BAY_TYPE_BY_CATEGORY[assignmentCategory] || 'Mechanical'}
              </Typography>
            </Box>
          </Modal>
        </form>
      </FormProvider>
    </Box>
  );
}
