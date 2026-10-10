import { useForm, FormProvider } from 'react-hook-form';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Box, Grid, Typography, Divider, Card, CardContent, Checkbox, FormControlLabel, IconButton, Chip, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import { Save, Search, MessageCircle, ArrowLeft, X, Plus, UserPlus, PlusCircle, Car } from 'lucide-react';
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
  'body-shop': 'Body Shop'

};

export default function JobCardCreate() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
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

  const returnTab = useMemo(() => {
    if (location.state?.activeTab) return location.state.activeTab;
    const searchParams = new URLSearchParams(location.search);
    const categoryQuery = (searchParams.get('category') || searchParams.get('department') || '').toLowerCase();
    const fromQuery = (searchParams.get('from') || '').toLowerCase();
    const jcStatus = String(jobCard?.currentStatus?.statusCode || jobCard?.currentStatus?.code || '').toUpperCase();
    const jcCategory = String(jobCard?.serviceType || jobCard?.category || '').toLowerCase();

    const stateTab = String(location.state?.activeTab || '').toLowerCase();
    const isWaterWashProcess =
      stateTab.includes('water') ||
      categoryQuery.includes('water') ||
      fromQuery.includes('water') ||
      moduleDepartment === 'water-wash' ||
      jcStatus.includes('WATER_WASH') ||
      jcCategory.includes('water');
    if (isWaterWashProcess) return 'waterwash';

    const isBodyShopProcess =
      categoryQuery.includes('body') ||
      fromQuery.includes('body') ||
      moduleDepartment === 'body-shop' ||
      jcStatus.includes('BODY_SHOP') ||
      jcCategory.includes('body');

    return isBodyShopProcess ? 'bodyshop' : 'mechanic';
  }, [location.state?.activeTab, location.search, moduleDepartment, jobCard]);
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
          serviceStatusCode: service.serviceStatus?.statusCode || service.serviceStatus?.code || '',
          isAdditional: Boolean(service.isAdditional)
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
        ).map(s => {
          const matchedService = (jobCard.services || []).find(
            js => typeof js === 'object' && (js.serviceItemId === s.id || js.id === s.id || js.serviceName === s.name || js.name === s.name)
          );
          return {
            ...s,
            isAdditional: Boolean(matchedService?.isAdditional)
          };
        });
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
    if (['water-wash', 'water_wash', 'water wash', 'waterwash', 'washing', 'wash'].includes(normalized)) return 'water-wash';
    return '';
  };

  const getRoleDepartment = () => {
    if (hasReadableModule(menus, ['admin', 'manager', 'managing-director', 'floor-supervisor', 'floor_supervisor'])) return 'all';
    if (moduleDepartment) return moduleDepartment;
    return 'all';
  };

  const getServiceStatusCode = (service) => {
    const selectedValue = service?.jobCardServiceId ? serviceStatusValues[service.jobCardServiceId] : null;
    const statusId = (selectedValue !== undefined && selectedValue !== null && selectedValue !== '')
      ? String(selectedValue)
      : String(service?.serviceStatusId || '');
    const currentStatus = serviceStatusOptions.find((status) => String(status.value) === String(statusId));
    return String(currentStatus?.code || service?.serviceStatusCode || '').trim().toUpperCase();
  };

  const getSavedServiceStatusCode = (service) => {
    const initialStatusId = String(service?.serviceStatusId || '');
    const currentStatus = serviceStatusOptions.find((status) => String(status.value) === initialStatusId);
    return String(currentStatus?.code || service?.serviceStatusCode || '').trim().toUpperCase();
  };

  const isSavedServiceCompleted = (service) => {
    const code = getSavedServiceStatusCode(service);
    return ['COMPLETED', 'POSTPONED', 'REJECTED', 'CANCELLED'].some((status) => code.includes(status));
  };

  const isServiceCompletedOrPostponed = (service) => {
    const code = getServiceStatusCode(service);
    return ['COMPLETED', 'POSTPONED', 'REJECTED', 'CANCELLED'].some((status) => code.includes(status));
  };

  const arePreviousDepartmentsCompleted = (department) => {
    const order = ['mechanical', 'body-shop'];
    const departmentIndex = order.indexOf(department);
    const previousDepartments = order.slice(0, departmentIndex);

    return previousDepartments.every((previousDepartment) => {
      const services = selectedServices.filter((service) => getServiceDepartment(service) === previousDepartment);
      return services.length === 0 || services.every(isServiceCompletedOrPostponed);
    });
  };

  const canEditServiceStatus = (service) => {
    const roleDepartment = getRoleDepartment();
    if (roleDepartment === 'all') return !isSavedServiceCompleted(service);

    const serviceDepartment = getServiceDepartment(service);
    if (serviceDepartment === 'water-wash') return !isSavedServiceCompleted(service);
    return Boolean(roleDepartment)
      && (roleDepartment === serviceDepartment || roleDepartment === 'all')
      && arePreviousDepartmentsCompleted(serviceDepartment)
      && !isSavedServiceCompleted(service);
  };

  const getAssignmentDepartment = (assignment) => {
    const category = assignment?.jobCardService?.serviceItem?.category || assignment?.service?.category;
    const normalized = normalizeDepartment(category?.slug || category?.name);
    if (['mechanical', 'mechanic', 'mechnanic', 'floor'].includes(normalized)) return 'mechanical';
    if (['body-shop', 'bodyshop', 'paint', 'denting'].includes(normalized)) return 'body-shop';
    if (['water-wash', 'water_wash', 'water wash', 'waterwash', 'washing', 'wash'].includes(normalized)) return 'water-wash';
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

    const uncompletedService = selectedServices.find(s => !isSavedServiceCompleted(s));
    if (uncompletedService) {
      const dept = getServiceDepartment(uncompletedService);
      if (dept) return dept;
    }

    const selectedServiceCategory = selectedServices.map(getServiceDepartment).find(Boolean);
    if (selectedServiceCategory) return selectedServiceCategory;

    if (moduleDepartment) return moduleDepartment;
    return 'mechanical';
  }, [activeAssignmentDetails, selectedServices, moduleDepartment, menus, isSavedServiceCompleted]);

  const isWaterWashContext = assignmentCategory === 'water-wash' ||
    (selectedServices.length > 0 && selectedServices.every(s => getServiceDepartment(s) === 'water-wash' || isSavedServiceCompleted(s)) && selectedServices.some(s => getServiceDepartment(s) === 'water-wash' && !isSavedServiceCompleted(s)));

  const canReassignExistingWork = activeAssignmentDetails.some((assignment) => getAssignmentDepartment(assignment) === assignmentCategory);
  const assigneeLabel = assignmentCategory === 'body-shop' ? 'Technician' : 'Mechanic';
  const assignButtonLabel = canReassignExistingWork ? `Reassign ${assigneeLabel} & Bay` : `Assign ${assigneeLabel} & Bay`;

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
            .filter((service) => {
              if (!service.jobCardServiceId) return false;
              const currentVal = serviceStatusValues[service.jobCardServiceId];
              if (!currentVal) return false;
              const initialVal = service.serviceStatusId ? String(service.serviceStatusId) : '';
              return String(currentVal) !== initialVal;
            })
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
      navigate(ROUTES.JOB_CARDS, { state: { activeTab: returnTab } });
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
      if (serviceDept !== 'water-wash') {
        const hasAnyAssignment = assignmentDetails.some(a => getAssignmentDepartment(a) === serviceDept);

        if (!hasAnyAssignment) {
          toastError(`Please assign a mechanic and bay for ${serviceDept || 'this department'} services first.`);
          return;
        }
      }
    }

    setServiceStatusValues((current) => ({
      ...current,
      [jobCardServiceId]: statusId
    }));
  };

  const getInitials = (name) => {
    if (!name || name === 'Unknown' || name === '—') return 'CU';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return String(name).slice(0, 2).toUpperCase();
  };

  const computeServiceWorkStatus = () => {
    const services = selectedServices || [];
    const assignments = assignmentDetails || [];

    const hasMechanical = services.some(s => {
      const cat = String(s.category || s.serviceItem?.category?.name || s.name || '').toLowerCase();
      return cat.includes('mechanic') || cat.includes('floor');
    }) || assignments.some(a => String(a.jobCardService?.serviceItem?.category?.name || a.service?.category?.name || '').toLowerCase().includes('mechanic'));

    const hasBodyshop = services.some(s => {
      const cat = String(s.category || s.serviceItem?.category?.name || s.name || '').toLowerCase();
      return cat.includes('body') || cat.includes('denting') || cat.includes('paint');
    }) || assignments.some(a => String(a.jobCardService?.serviceItem?.category?.name || a.service?.category?.name || '').toLowerCase().includes('body'));

    const isAllCompleted = services.length > 0 && services.every(s => {
      const statusVal = s.jobCardServiceId ? serviceStatusValues[s.jobCardServiceId] : null;
      const opt = serviceStatusOptions.find(o => String(o.value) === String(statusVal));
      const code = String(opt?.code || s.serviceStatusCode || '').toUpperCase();
      return code.includes('COMPLETED') || code.includes('REJECTED') || code.includes('CANCELLED');
    });

    if (isAllCompleted) {
      if (hasMechanical && hasBodyshop) return 'Completed (Mechanical & Body Shop)';
      if (hasBodyshop) return 'Completed (Body Shop)';
      if (hasMechanical) return 'Completed (Mechanical)';
      return 'Completed';
    }

    if (hasMechanical && hasBodyshop) return 'Mechanical & Body Shop';
    if (hasBodyshop) return 'Body Shop Work';
    if (hasMechanical) return 'Mechanical Work';
    return watch('serviceType') || jobCard?.serviceType || 'Regular Service';
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', p: { xs: 2, md: '19px' } }}>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEditMode ? 'Edit Job Card' : 'Create Job Card'}
        </Typography>
        <BackButton
          onClick={() => navigate(ROUTES.JOB_CARDS, { state: { activeTab: returnTab } })}
          label="Back to List"
        />
      </Box>

      <FormProvider {...methods}>
        <form id="jobCardForm" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={4}>
            {/* LEFT COLUMN: FORM */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', p: 3, mb: 4 }}>
                <Box sx={{ pb: 1.5, mb: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Car size={18} color="#dc2626" />
                  <Typography variant="caption" fontWeight={800} sx={{ color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    VEHICLE & CUSTOMER DETAILS
                  </Typography>
                </Box>

                {isEditMode ? (
                  <Grid container spacing={3}>
                    {/* CUSTOMER COLUMN */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ pr: { md: 2 } }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: '#94a3b8', letterSpacing: '0.08em', display: 'block', mb: 2, textTransform: 'uppercase' }}>
                          CUSTOMER
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                          <Box sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            bgcolor: '#2563eb',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem',
                            flexShrink: 0
                          }}>
                            {getInitials(watch('ownerName') || jobCard?.ownerName || jobCard?.customer?.fullName)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', lineHeight: 1.2 }}>
                              {watch('ownerName') || jobCard?.ownerName || jobCard?.customer?.fullName || '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.25 }}>
                              {watch('ownerMobile') || jobCard?.ownerMobile || jobCard?.customer?.mobileNo || '—'}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Job Card No.:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#334155' }}>
                                {jobCard?.jobCardNo || jobCardIdentifier || '—'}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Entry Time:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                                {jobCard?.createdAt ? formatDate(new Date(jobCard.createdAt), 'hh:mm a') : '—'}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Est. Delivery:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#0d9488' }}>
                                {watch('deliveryDate') || (jobCard?.expectedDeliveryAt ? formatDate(new Date(jobCard.expectedDeliveryAt), 'dd - MM - yyyy hh:mm a') : '—')}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Service Type:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                                {computeServiceWorkStatus()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    </Grid>

                    {/* VEHICLE COLUMN */}
                    <Grid item xs={12} md={6} sx={{ borderLeft: { md: '1px solid #f1f5f9' }, pl: { md: 3 } }}>
                      <Box>
                        <Typography variant="caption" fontWeight={800} sx={{ color: '#94a3b8', letterSpacing: '0.08em', display: 'block', mb: 2, textTransform: 'uppercase' }}>
                          VEHICLE
                        </Typography>

                        <Typography variant="h4" fontWeight={800} sx={{ color: '#1e40af', letterSpacing: '0.05em', mb: 2, fontFamily: 'monospace, sans-serif' }}>
                          {watch('vehicleNumber') || jobCard?.vehicleNumber || jobCard?.vehicle?.registrationNo || '—'}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Make/Model:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>
                                {watch('makeModel') || jobCard?.makeModel || '—'}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Colour:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                                {jobCard?.vehicle?.color || jobCard?.vehicleColor || jobCard?.color || 'White'}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Fuel:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                                {jobCard?.vehicle?.fuelType || jobCard?.fuelType || 'Petrol'}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Mechanic:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                                {(activeAssignmentDetails[0]?.assignedUser?.fullName || assignmentDetails[0]?.assignedUser?.fullName || jobCard?.technician || jobCard?.assignedMechanic?.fullName || 'Unassigned')}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Grid container spacing={1}>
                            <Grid item xs={5}>
                              <Typography variant="body2" color="text.secondary" fontWeight={500}>Bay:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                                {(activeAssignmentDetails[0]?.bay?.bayName || activeAssignmentDetails[0]?.bay?.bayCode || activeAssignmentDetails[0]?.bay?.name || assignmentDetails[0]?.bay?.bayName || assignmentDetails[0]?.bay?.bayCode || assignmentDetails[0]?.bay?.name || jobCard?.bay?.bayName || jobCard?.bay?.name || jobCard?.assignedBay?.bayName || jobCard?.assignedBay?.name || '—')}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        {!hasReadableModule(menus, ['manager', 'managing-director']) && !isWaterWashContext && (
                          <Box sx={{ mt: 2.5 }}>
                            <Button
                              type="button"
                              variant="secondary"
                              leftIcon={UserPlus}
                              onClick={openAssignModal}
                              fullWidth
                            >
                              {assignButtonLabel}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <RHFTextField name="vehicleNumber" label="Registration Number" placeholder="TN 01 AB 1234" required />
                          </Box>
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
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <RHFTextField name="makeModel" label="Brand & Model" placeholder="e.g. Hyundai Creta" required />
                      </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <RHFTextField name="ownerName" label="Owner Name" placeholder="Full name" required />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <RHFTextField name="ownerMobile" label="Mobile Number" placeholder="10-digit mobile" required />
                      </Grid>
                    </Grid>

                    <Grid container spacing={3} sx={{ mt: 0 }}>
                      <Grid item xs={12} md={6}>
                        <RHFTextField name="deliveryDate" label="Expected Delivery" type="datetime-local" required />
                      </Grid>
                    </Grid>
                  </>
                )}
              </Card>

              <Card sx={{ borderRadius: 3, boxShadow: 0, p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Service Configuration & Master List
                  </Typography>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      leftIcon={PlusCircle}
                      onClick={() => {
                        const searchParams = new URLSearchParams(location.search);
                        const categoryQuery = (searchParams.get('category') || searchParams.get('department') || '').toLowerCase();
                        const fromQuery = (searchParams.get('from') || '').toLowerCase();
                        const stateTab = String(location.state?.activeTab || location.state?.department || location.state?.category || '').toLowerCase();
                        const jcStatus = String(jobCard?.currentStatus?.statusCode || jobCard?.currentStatus?.code || '').toUpperCase();
                        const jcCategory = String(jobCard?.serviceType || jobCard?.category || '').toLowerCase();
                        const isWaterWashProcess =
                          stateTab.includes('water') ||
                          categoryQuery.includes('water') ||
                          fromQuery.includes('water') ||
                          moduleDepartment === 'water-wash' ||
                          jcStatus.includes('WATER_WASH') ||
                          jcCategory.includes('water') ||
                          (Array.isArray(selectedServices) && selectedServices.some(s => getServiceDepartment(s) === 'water-wash' && !isSavedServiceCompleted(s)));
                        const isBodyShopProcess =
                          !isWaterWashProcess && (
                            stateTab.includes('body') ||
                            categoryQuery.includes('body') ||
                            fromQuery.includes('body') ||
                            moduleDepartment === 'body-shop' ||
                            jcStatus.includes('BODY_SHOP') ||
                            jcCategory.includes('body')
                          );
                        const categoryParam = isWaterWashProcess ? 'water-wash' : (isBodyShopProcess ? 'body-shop' : 'mechanical');
                        const jobCardIdParam = encodeURIComponent(jobCard?.slug || jobCard?.jobCardNo || jobCardIdentifier);
                        const targetRoute = isBodyShopProcess ? ROUTES.BODY_SHOP_ADDITIONAL_WORK_NEW : ROUTES.FLOOR_ADDITIONAL_WORK_NEW;
                        const fromEditPath = encodeURIComponent(location.pathname + location.search);
                        navigate(`${targetRoute}?jobCardId=${jobCardIdParam}&category=${categoryParam}&from=${fromEditPath}`, {
                          state: location.state
                        });
                      }}
                    >
                      Add Additional Work
                    </Button>
                  )}
                </Box>

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
                      <>
                        {/* Regular Services */}
                        {selectedServices.filter(s => !s.isAdditional).map((service) => (
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
                        ))}

                        {/* Additional Work & Services Sub-section */}
                        {selectedServices.some(s => s.isAdditional) && (
                          <>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 1.25,
                                bgcolor: '#f0fdf4',
                                borderTop: '1px solid #bbf7d0',
                                borderBottom: '1px solid #bbf7d0'
                              }}
                            >
                              <PlusCircle size={15} color="#16a34a" />
                              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#15803d', fontSize: '0.8125rem' }}>
                                Additional Work & Services
                              </Typography>
                              <Chip
                                label={`${selectedServices.filter(s => s.isAdditional).length} Added`}
                                size="small"
                                sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.7rem', height: 20 }}
                              />
                            </Box>

                            {selectedServices.filter(s => s.isAdditional).map((service) => (
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
                                  borderColor: 'divider',
                                  bgcolor: '#fafafa'
                                }}
                              >
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={700}>{service.name}</Typography>
                                    <Chip label="Additional" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.65rem', height: 18, px: 0.5 }} />
                                  </Box>
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
                            ))}
                          </>
                        )}
                      </>
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
                      <>
                        {/* Regular Bill Services */}
                        {activeBillServices.filter(item => !item.isAdditional).map((item) => (
                          <Box key={item.jobCardServiceId || item.serviceItemId || item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
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
                        ))}

                        {/* Additional Work Bill Services */}
                        {activeBillServices.some(item => item.isAdditional) && (
                          <>
                            <Box sx={{ pt: 2, pb: 0.75, px: 0.5, display: 'flex', alignItems: 'center', gap: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                              <PlusCircle size={14} color="#16a34a" />
                              <Typography variant="caption" fontWeight={800} sx={{ color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Additional Work
                              </Typography>
                            </Box>
                            {activeBillServices.filter(item => item.isAdditional).map((item) => (
                              <Box key={item.jobCardServiceId || item.serviceItemId || item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight={500}>{item.name} <Typography component="span" variant="caption" color="text.secondary">x1</Typography></Typography>
                                  <Chip label="Additional" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.65rem', height: 18, px: 0.5 }} />
                                </Box>
                                <Typography variant="body2" fontWeight={600}>{formatCurrency(item.price)}</Typography>
                              </Box>
                            ))}
                          </>
                        )}
                      </>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>{assigneeLabel}</InputLabel>
                <Select
                  value={selectedAssignUser}
                  label={assigneeLabel}
                  onChange={(event) => setSelectedAssignUser(event.target.value)}
                  disabled={isMechanicsLoading || assignMutation.isPending}
                  sx={{ borderRadius: 2 }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 240,
                      },
                    },
                  }}
                >
                  {isMechanicsLoading && (
                    <MenuItem disabled value="">
                      Loading {assigneeLabel.toLowerCase()}s...
                    </MenuItem>
                  )}
                  {!isMechanicsLoading && mechanics.length === 0 && (
                    <MenuItem disabled value="">
                      No active {assigneeLabel.toLowerCase()}s found
                    </MenuItem>
                  )}
                  {mechanics.map((mechanic) => {
                    const isBusy = mechanic.activeJobCount > 0;
                    const statusText = mechanic.availabilityLabel || (isBusy ? `Busy (${mechanic.activeJobCount} job${mechanic.activeJobCount > 1 ? 's' : ''})` : 'Available');
                    return (
                      <MenuItem key={mechanic.id} value={mechanic.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {mechanic.fullName}{mechanic.employeeCode ? ` - ${mechanic.employeeCode}` : ''}
                          </Typography>
                          <Chip
                            size="small"
                            label={statusText}
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: isBusy ? '#FEF3C7' : '#DCFCE7',
                              color: isBusy ? '#B45309' : '#15803D',
                              border: '1px solid',
                              borderColor: isBusy ? '#FCD34D' : '#86EFAC',
                            }}
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Bay</InputLabel>
                <Select
                  value={selectedAssignBay}
                  label="Bay"
                  onChange={(event) => setSelectedAssignBay(event.target.value)}
                  disabled={isBaysLoading || assignMutation.isPending}
                  sx={{ borderRadius: 2 }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 240,
                      },
                    },
                  }}
                >
                  {isBaysLoading && (
                    <MenuItem disabled value="">
                      Loading bays...
                    </MenuItem>
                  )}
                  {!isBaysLoading && bays.length === 0 && (
                    <MenuItem disabled value="">
                      No active bays found
                    </MenuItem>
                  )}
                  {bays.map((bay) => {
                    const isCurrentJobBay = activeAssignmentDetails.some((assignment) => String(assignment.bayId || assignment.bay?.id) === String(bay.id));
                    const isBusy = bay.availability === 'BUSY' && !isCurrentJobBay;
                    const statusText = isCurrentJobBay ? 'Current' : (bay.availabilityLabel || (isBusy ? 'Busy' : 'Available'));
                    return (
                      <MenuItem key={bay.id} value={bay.id} disabled={isBusy}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {bay.bayName || bay.bayCode}
                          </Typography>
                          <Chip
                            size="small"
                            label={statusText}
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: isCurrentJobBay ? '#DBEAFE' : isBusy ? '#FEF3C7' : '#DCFCE7',
                              color: isCurrentJobBay ? '#1E40AF' : isBusy ? '#B45309' : '#15803D',
                              border: '1px solid',
                              borderColor: isCurrentJobBay ? '#93C5FD' : isBusy ? '#FCD34D' : '#86EFAC',
                            }}
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, mt: -0.5 }}>
                Category: {BAY_TYPE_BY_CATEGORY[assignmentCategory] || 'Mechanical'}
              </Typography>
            </Box>
          </Modal>
        </form>
      </FormProvider>
    </Box>
  );
}
