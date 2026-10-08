import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Grid, Card, Typography, Divider, Chip, IconButton, FormControl, InputLabel, Select, MenuItem, TextField, Skeleton } from '@mui/material';
import { ArrowLeft, ArrowRight, Car, User, Shield, FileText, AlertTriangle, PlusCircle, Clock, ChevronDown, ChevronUp, Wrench, Play, Filter, PauseCircle, PlayCircle, Mic, Plus, Minus, MapPin, Maximize2, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useJobCard } from '../../queries/useDataQueries';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import PageHeader from '../../components/shared/PageHeader';
import Modal from '../../components/common/Modal';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../config/routes';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toastSuccess, toastError } from '../../notifications/toast';
import { postponeJobCardServiceApi, resumeJobCardServiceApi } from '../../api/jobCardApi';
import { getMechanicsDropdownApi } from '../../api/userApi';
import { adminBayApi } from '../../api/adminBayApi';
import useAuthStore from '../../store/useAuthStore';

export default function JobCardDetailPage() {
  const { id, slug } = useParams();
  const jobCardIdentifier = slug || id;
  const navigate = useNavigate();
  const location = useLocation();
  const { data: jobCard, isLoading } = useJobCard(jobCardIdentifier);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [expandedApprovalIds, setExpandedApprovalIds] = useState({});
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [trackerNow, setTrackerNow] = useState(() => Date.now());
  const [isJobProgressOpen, setIsJobProgressOpen] = useState(true);
  const [isTimeTrackerOpen, setIsTimeTrackerOpen] = useState(true);
  const [isAssignedWorkOpen, setIsAssignedWorkOpen] = useState(true);
  const [isInspectionPhotosOpen, setIsInspectionPhotosOpen] = useState(true);

  useEffect(() => {
    const timerId = window.setInterval(() => setTrackerNow(Date.now()), 60000);
    return () => window.clearInterval(timerId);
  }, []);

  const { user, role } = useAuthStore();
  const locationId = user?.locationId || user?.location_id || user?.branchId || '';
  const queryClient = useQueryClient();

  const [postponeModal, setPostponeModal] = useState({ isOpen: false, item: null });
  const [postponeReason, setPostponeReason] = useState('');

  const [resumeModal, setResumeModal] = useState({ isOpen: false, item: null });
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [selectedBay, setSelectedBay] = useState('');

  const resumeQueueCategory = resumeModal.item?.category || 'mechanical';

  const { data: mechanicsResponse, isLoading: isMechanicsLoading } = useQuery({
    queryKey: ['mechanics-dropdown', role, locationId, resumeQueueCategory],
    queryFn: () => getMechanicsDropdownApi({ locationId, category: resumeQueueCategory }),
    enabled: !!resumeModal.isOpen,
    staleTime: 60000
  });

  const { data: baysResponse, isLoading: isBaysLoading } = useQuery({
    queryKey: ['assignment-bays', role, locationId, resumeQueueCategory],
    queryFn: () => adminBayApi.getBayDropdown({
      locationId,
      bayType: resumeQueueCategory === 'body-shop' ? 'Body Shop' : resumeQueueCategory === 'water-wash' ? 'Water Wash' : 'Mechanical'
    }),
    enabled: !!resumeModal.isOpen,
    staleTime: 30000
  });

  const mechanics = mechanicsResponse?.data?.users || mechanicsResponse?.users || [];
  const bays = baysResponse?.data?.bays || baysResponse?.data?.data?.bays || baysResponse?.bays || [];

  const postponeMutation = useMutation({
    mutationFn: ({ serviceId, payload }) => postponeJobCardServiceApi(jobCard.id, serviceId, payload),
    onSuccess: () => {
      toastSuccess('Service postponed successfully');
      setPostponeModal({ isOpen: false, item: null });
      setPostponeReason('');
      queryClient.invalidateQueries({ queryKey: ['jobCard', jobCardIdentifier] });
    },
    onError: (error) => toastError(error?.response?.data?.message || error?.message || 'Failed to postpone service')
  });

  const resumeMutation = useMutation({
    mutationFn: ({ serviceId, payload }) => resumeJobCardServiceApi(jobCard.id, serviceId, payload),
    onSuccess: () => {
      toastSuccess('Service resumed successfully');
      setResumeModal({ isOpen: false, item: null });
      setSelectedMechanic('');
      setSelectedBay('');
      queryClient.invalidateQueries({ queryKey: ['jobCard', jobCardIdentifier] });
    },
    onError: (error) => toastError(error?.response?.data?.message || error?.message || 'Failed to resume service')
  });

  const handleBack = () => {
    if (location.state?.fromVehicleHistory) {
      navigate(-1);
    } else {
      navigate(ROUTES.JOB_CARDS, { state: { activeTab: location.state?.activeTab } });
    }
  };

  const assignmentDetails = useMemo(() => {
    const assignments = Array.isArray(jobCard?.workAssignments) ? jobCard.workAssignments : [];
    return assignments.filter((assignment) => assignment?.assignedUser || assignment?.jobCardService || assignment?.service);
  }, [jobCard]);

  const getAssignmentStatusCode = (assignment) => {
    return String(assignment?.status?.statusCode || assignment?.status?.code || '').toUpperCase();
  };

  const getAssignmentStatusValue = (assignment) => {
    const statusCode = getAssignmentStatusCode(assignment);
    if (statusCode.includes('ON_HOLD') || statusCode.includes('POSTPONED')) return 'ON_HOLD';
    if (statusCode.includes('COMPLETED')) return 'COMPLETED';
    if (statusCode.includes('IN_PROGRESS')) return 'IN_PROGRESS';
    return 'ASSIGNED';
  };

  const getAssignmentStatusLabel = (assignment) => {
    const statusValue = getAssignmentStatusValue(assignment);
    if (statusValue === 'ON_HOLD') return 'On Hold';
    if (statusValue === 'COMPLETED') return 'Completed';
    if (statusValue === 'IN_PROGRESS') return 'In Progress';
    return 'Assigned';
  };

  const getAssignmentStatusColor = (assignment) => {
    const statusValue = getAssignmentStatusValue(assignment);
    if (statusValue === 'ON_HOLD') return 'error';
    if (statusValue === 'COMPLETED') return 'success';
    if (statusValue === 'IN_PROGRESS') return 'info';
    return 'warning';
  };

  if (isLoading) {
    return <Loader text="Loading job card details..." />;
  }

  if (!jobCard) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3, m: 3 }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Job Card Not Found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The job card "{jobCardIdentifier}" could not be located in our records.
        </Typography>
        <Button variant="primary" leftIcon={ArrowLeft} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  const vehicleBrandModel = [
    jobCard.vehicle?.brand?.name,
    jobCard.vehicle?.model
  ].filter(Boolean).join(' ');
  const complaintText = String(jobCard.customerComplaint || '').trim();
  const additionalNotesText = String(jobCard.additionalNotes || '').trim();
  const legacyNotesText = !complaintText && !additionalNotesText ? String(jobCard.notes || '').trim() : '';


  const displayJobCard = {
    ...jobCard,
    id: jobCard.jobCardNo || jobCard.id,
    createdAt: jobCard.createdAt,
    ownerName: jobCard.customer?.fullName || jobCard.ownerName || 'Unknown',
    ownerMobile: jobCard.customer?.mobileNo || jobCard.ownerMobile || jobCard.mobile || '—',
    vehicleNumber: jobCard.vehicle?.registrationNo || jobCard.vehicleNumber || '—',
    serviceType: jobCard.gateEntry?.entryType || jobCard.serviceType || '—',
    vehicleBrandModel: vehicleBrandModel || jobCard.makeModel || jobCard.vehicleModel || '-',
    estimatedCost: jobCard.totalEstimate || jobCard.estimatedCost || 0,
    complaint: complaintText,
    additionalNotes: additionalNotesText,
    notes: legacyNotesText,
    status: jobCard.currentStatus?.statusCode || jobCard.status || 'PENDING',
    services: Array.isArray(jobCard.services) && typeof jobCard.services[0] === 'string'
      ? jobCard.services.map(s => ({ name: s, price: 0, quantity: 1, status: 'PENDING', isAdditional: false }))
      : (jobCard.services?.map(s => ({
        name: s.serviceName || s.serviceItem?.name || 'Unknown Service',
        price: Number(s.price || 0),
        quantity: Number(s.quantity || 1),
        status: s.serviceStatus?.statusCode || 'PENDING',
        isAdditional: !!s.isAdditional
      })) || [])
  };

  const rawPhotos = [
    ...(Array.isArray(jobCard?.photos) ? jobCard.photos : []),
    ...(Array.isArray(jobCard?.media) ? jobCard.media : []),
    ...(Array.isArray(jobCard?.mediaFiles) ? jobCard.mediaFiles : []),
    ...(Array.isArray(jobCard?.vehicle?.mediaFiles) ? jobCard.vehicle.mediaFiles : []),
    ...(Array.isArray(jobCard?.gateEntry?.mediaFiles) ? jobCard.gateEntry.mediaFiles : [])
  ];

  const uniquePhotosMap = new Map();
  rawPhotos.forEach((p, idx) => {
    let photoUrl = p?.fileUrl || p?.mediaUrl || p?.url || p?.blobUrl || '';
    if (photoUrl && typeof photoUrl === 'string') {
      if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://') && !photoUrl.startsWith('data:') && !photoUrl.startsWith('blob:')) {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const serverOrigin = apiBase ? apiBase.replace(/\/api\/?$/, '') : window.location.origin;
        photoUrl = `${serverOrigin}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
      }
      const key = p.id || photoUrl;
      if (!uniquePhotosMap.has(key)) {
        uniquePhotosMap.set(key, {
          id: p.id || `photo-${idx}`,
          url: photoUrl,
          category: p.category || p.name || `Photo #${idx + 1}`,
          fileName: p.fileName || p.originalname || p.originalName || p.name || ''
        });
      }
    }
  });

  const vehiclePhotos = Array.from(uniquePhotosMap.values()).filter((img) => {
    const cat = String(img.category || '').toUpperCase();
    const fname = String(img.fileName || '').toLowerCase();
    const url = String(img.url || '').toLowerCase();
    return (
      cat !== 'SIGNATURE' &&
      !fname.includes('signature') &&
      !fname.includes('sign_') &&
      !fname.includes('sign-') &&
      !url.includes('signature')
    );
  });

  const allServices = displayJobCard.services || [];
  const defaultServices = allServices.filter(s => !s.isAdditional);
  const additionalServices = allServices.filter(s => s.isAdditional);
  const noteItems = [
    displayJobCard.complaint ? { label: 'Customer Complaint', value: displayJobCard.complaint } : null,
    displayJobCard.additionalNotes ? { label: 'Additional Notes', value: displayJobCard.additionalNotes } : null,
    displayJobCard.notes ? { label: 'Notes', value: displayJobCard.notes } : null
  ].filter(Boolean);

  const taxRate = jobCard.billing?.taxRate ?? jobCard.taxRate ?? 18;
  const rawTotalSubtotal = jobCard.billing?.serviceSubtotal ?? jobCard.serviceSubtotal ?? (displayJobCard.estimatedCost / (1 + taxRate / 100));

  const validInitialServices = defaultServices.filter(s => s.status !== 'REJECTED' && s.status !== 'CANCELLED');
  const initialServicesSum = validInitialServices.reduce((sum, s) => sum + (Number(s.price || 0) * Number(s.quantity || 1)), 0);
  const hasItemPrices = validInitialServices.some(s => Number(s.price) > 0);

  const approvedAdditionalTotal = additionalServices
    .filter(s => s.status !== 'REJECTED' && s.status !== 'CANCELLED')
    .reduce((sum, s) => sum + (Number(s.price || 0) * Number(s.quantity || 1)), 0);

  const fallbackBaseSubtotal = Math.max(0, rawTotalSubtotal - approvedAdditionalTotal);
  const baseSubtotal = hasItemPrices ? initialServicesSum : (fallbackBaseSubtotal > 0 ? fallbackBaseSubtotal : rawTotalSubtotal);

  const discountAmount = jobCard.billing?.discountAmount ?? jobCard.discountAmount ?? 0;
  const combinedSubtotal = baseSubtotal + approvedAdditionalTotal;
  const taxableAmount = Math.max(0, combinedSubtotal - discountAmount);
  const totalTaxAmount = (taxableAmount * (taxRate / 100));
  const totalGrandTotal = taxableAmount + totalTaxAmount;

  const getInitials = (name) => {
    if (!name || name === 'Unknown' || name === '—') return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const firstAssignment = assignmentDetails[0] || {};
  const activeAssignment = assignmentDetails.find(a => !a.completedAt) || firstAssignment;
  const assignedMechanicName = activeAssignment.assignedUser?.fullName || firstAssignment.assignedUser?.fullName || jobCard.technician || jobCard.assignedMechanic?.fullName || 'Unassigned';
  const assignedBayName = activeAssignment.bay?.bayName || activeAssignment.bay?.bayCode || activeAssignment.bay?.name || firstAssignment.bay?.bayName || firstAssignment.bay?.bayCode || firstAssignment.bay?.name || jobCard.bay?.bayName || jobCard.bay?.name || jobCard.assignedBay?.bayName || jobCard.assignedBay?.name || '—';

  const isServiceBodyshop = (s) => {
    const cat = String(s.categorySlug || s.category?.slug || s.serviceItem?.category?.slug || s.category || s.serviceItem?.category?.name || '').toLowerCase();
    if (cat && (cat.includes('body') || cat.includes('mechanic'))) {
      return cat.includes('body');
    }
    const name = String(s.name || '').toLowerCase();
    return name.includes('body') || name.includes('denting') || name.includes('paint');
  };

  const isAssignmentBodyshop = (a) => {
    const cat = String(a.jobCardService?.serviceItem?.category?.slug || a.service?.category?.slug || a.jobCardService?.serviceItem?.category?.name || a.service?.category?.name || '').toLowerCase();
    if (cat && (cat.includes('body') || cat.includes('mechanic'))) {
      return cat.includes('body');
    }
    return cat.includes('body') || cat.includes('denting') || cat.includes('paint');
  };

  const computeServiceWorkStatus = () => {
    const services = displayJobCard.services || [];
    const assignments = jobCard?.workAssignments || [];

    const hasBodyshop = services.some(isServiceBodyshop) || assignments.some(isAssignmentBodyshop);
    const hasMechanical = services.some(s => !isServiceBodyshop(s)) || assignments.some(a => !isAssignmentBodyshop(a));

    const isAllCompleted = services.length > 0 && services.every(s => {
      const st = String(s.status || s.serviceStatus?.statusCode || s.serviceStatus?.code || '').toUpperCase();
      return st.includes('COMPLETED') || st.includes('REJECTED') || st.includes('CANCELLED');
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
    return displayJobCard.serviceType || 'Regular Service';
  };

  const services = displayJobCard?.services || [];
  const assignments = jobCard?.workAssignments || [];

  const hasBodyshopWork = services.some(isServiceBodyshop) || assignments.some(isAssignmentBodyshop);
  const hasMechanicalWork = services.some(s => !isServiceBodyshop(s)) || assignments.some(a => !isAssignmentBodyshop(a));

  const mechanicalAssignments = assignments.filter(a => !isAssignmentBodyshop(a));
  const isMechanicalDone = hasMechanicalWork && (
    mechanicalAssignments.length > 0
      ? mechanicalAssignments.every(a => !!a.completedAt || getAssignmentStatusValue(a) === 'COMPLETED')
      : services.filter(s => !isServiceBodyshop(s)).every(s => s.status === 'COMPLETED' || s.status === 'REJECTED')
  );

  const bodyshopAssignments = assignments.filter(a => isAssignmentBodyshop(a));
  const isBodyshopDone = hasBodyshopWork && (
    bodyshopAssignments.length > 0
      ? bodyshopAssignments.every(a => !!a.completedAt || getAssignmentStatusValue(a) === 'COMPLETED')
      : services.filter(s => isServiceBodyshop(s)).every(s => s.status === 'COMPLETED' || s.status === 'REJECTED')
  );

  const pendingApprovalsCount = (jobCard?.approvals || []).filter(a => {
    const st = String(a.statusCode || a.customerResponse || a.status || '').toUpperCase();
    return st.includes('PENDING');
  }).length;

  const jcStatusCode = String(jobCard?.currentStatus?.statusCode || jobCard?.status || '').toUpperCase();
  const isJobDelivered = jcStatusCode.includes('DELIVERED');

  const entryTimeStr = jobCard?.gateEntry?.entryTime || jobCard?.createdAt;
  const entryFormatted = entryTimeStr ? formatDateTime(entryTimeStr) : '—';
  const entryActor = jobCard?.gateEntry?.createdByUser?.fullName || jobCard?.gateEntry?.enteredBy?.fullName || 'Gate Security';

  const createdFormatted = jobCard?.createdAt ? formatDateTime(jobCard.createdAt) : '—';
  const creatorActor = jobCard?.advisor?.fullName || jobCard?.createdByUser?.fullName || 'CRM Team';
  const estCostFormatted = formatCurrency(totalGrandTotal || displayJobCard?.estimatedCost || 0);

  const isMechanicalActive = mechanicalAssignments.some(a => {
    const st = getAssignmentStatusValue(a);
    return st === 'IN_PROGRESS' || st === 'ASSIGNED';
  });
  
  const isBodyshopActive = bodyshopAssignments.some(a => {
    const st = getAssignmentStatusValue(a);
    return st === 'IN_PROGRESS' || st === 'ASSIGNED';
  });

  const mechanicalState = !hasMechanicalWork
    ? 'completed'
    : (isMechanicalDone ? 'completed' : (isMechanicalActive ? 'active' : (mechanicalAssignments.length === 0 ? 'in_progress' : 'pending')));

  const bodyshopState = !hasBodyshopWork
    ? 'completed'
    : (isBodyshopDone ? 'completed' : (isBodyshopActive ? 'active' : (bodyshopAssignments.length === 0 ? 'in_progress' : 'pending')));

  const deliveryState = isJobDelivered
    ? 'completed'
    : ((!hasMechanicalWork || isMechanicalDone) && (!hasBodyshopWork || isBodyshopDone) && pendingApprovalsCount === 0 ? 'active' : 'pending');

  const activeMech = mechanicalAssignments.find(a => !a.completedAt) || mechanicalAssignments[0] || {};
  const mechName = activeMech.assignedUser?.fullName || jobCard.technician || jobCard.assignedMechanic?.fullName || 'Unassigned';
  const mechBay = activeMech.bay?.bayName || activeMech.bay?.bayCode || activeMech.bay?.name || jobCard.bay?.bayName || jobCard.bay?.name || jobCard.assignedBay?.bayName || jobCard.assignedBay?.name || '—';

  const activeBody = bodyshopAssignments.find(a => !a.completedAt) || bodyshopAssignments[0] || {};
  const bodyName = activeBody.assignedUser?.fullName || 'Unassigned';
  const bodyBay = activeBody.bay?.bayName || activeBody.bay?.bayCode || activeBody.bay?.name || '—';

  const timelineSteps = [
    {
      id: 'entry',
      title: 'Vehicle Entry',
      subtitle: `${entryFormatted} · ${entryActor}`,
      state: 'completed'
    },
    {
      id: 'created',
      title: 'Job Card Created',
      subtitle: `${createdFormatted} · ${creatorActor} · ${estCostFormatted} est.`,
      state: 'completed'
    },
    {
      id: 'mechanical',
      title: 'Mechanical Work',
      subtitle: !hasMechanicalWork
        ? 'N/A (No Mechanical Services)'
        : (isMechanicalDone
          ? 'Mechanical Work Completed'
          : (mechanicalAssignments.length > 0
            ? `Assigned to ${mechName}${mechBay !== '—' ? ` · ${mechBay}` : ''}`
            : 'In Progress / Pending Assignment')),
      state: mechanicalState
    },
    {
      id: 'approval',
      title: 'Customer Approvals',
      subtitle: pendingApprovalsCount > 0
        ? `Pending — ${pendingApprovalsCount} item${pendingApprovalsCount > 1 ? 's' : ''} awaiting`
        : (additionalServices.length > 0 ? 'All additional work approved' : 'No pending approval'),
      state: pendingApprovalsCount > 0 ? 'active' : 'completed'
    },
    {
      id: 'bodyshop',
      title: 'Body Shop',
      subtitle: !hasBodyshopWork
        ? 'N/A (No Body Shop Services)'
        : (isBodyshopDone
          ? 'Body Shop Work Completed'
          : (bodyshopAssignments.length > 0
            ? `Assigned to ${bodyName}${bodyBay !== '—' ? ` · ${bodyBay}` : ''}`
            : 'Pending Body Shop Work')),
      state: bodyshopState
    },
    {
      id: 'delivery',
      title: 'Vehicle Delivery',
      subtitle: isJobDelivered
        ? 'Vehicle Delivered'
        : (deliveryState === 'active'
          ? `Ready for Delivery — Expected: ${displayJobCard?.expectedDeliveryAt ? formatDateTime(displayJobCard.expectedDeliveryAt) : (jobCard?.expectedDeliveryDate ? formatDateTime(jobCard.expectedDeliveryDate) : 'Today 5:00 PM')}`
          : `Expected: ${displayJobCard?.expectedDeliveryAt ? formatDateTime(displayJobCard.expectedDeliveryAt) : (jobCard?.expectedDeliveryDate ? formatDateTime(jobCard.expectedDeliveryDate) : 'Today 5:00 PM')}`),
      state: deliveryState
    }
  ];

  const formatTimeOnly = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '—';
    }
  };

  // Shows date + time in compact form e.g. "28 Sep, 03:42 pm"
  const formatDateTimeShort = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '—';
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mon = monthNames[d.getMonth()];
      const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${day} ${mon}, ${timeStr}`;
    } catch (e) {
      return '—';
    }
  };

  const formatTrackerDateTime = (dateVal) => {
    if (!dateVal) return '—';
    const date = new Date(dateVal);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getTimeInterval = (startValue, endValue) => {
    const start = new Date(startValue).getTime();
    const end = endValue ? new Date(endValue).getTime() : trackerNow;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
    return { start, end };
  };

  const formatDuration = (durationMs) => {
    if (durationMs <= 0) return '0m';
    const totalMinutes = Math.floor(durationMs / 60000);
    if (totalMinutes === 0) return '<1m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
  };

  const getMergedDurationText = (intervals) => {
    const validIntervals = intervals.filter(Boolean).sort((a, b) => a.start - b.start);
    if (validIntervals.length === 0) return '—';

    let totalMs = 0;
    let currentStart = validIntervals[0].start;
    let currentEnd = validIntervals[0].end;
    for (const interval of validIntervals.slice(1)) {
      if (interval.start <= currentEnd) {
        currentEnd = Math.max(currentEnd, interval.end);
      } else {
        totalMs += currentEnd - currentStart;
        currentStart = interval.start;
        currentEnd = interval.end;
      }
    }
    totalMs += currentEnd - currentStart;
    return formatDuration(totalMs);
  };

  // ── TIME TRACKER: all values derived from real backend fields ──────────────

  const gateTimeFormatted = formatTrackerDateTime(jobCard?.gateEntry?.entryTime || jobCard?.createdAt);
  const trackerAssignments = assignments;
  const trackerApprovals = (jobCard?.approvals || []).filter(
    approval => String(approval.approvalType || '').toUpperCase() === 'ADDITIONAL_WORK'
  );
  const getAssignmentCategory = (assignment) => String(
    assignment.jobCardService?.serviceItem?.category?.slug ||
    assignment.jobCardService?.serviceItem?.category?.name ||
    assignment.service?.category?.slug ||
    assignment.service?.category?.name || ''
  ).toLowerCase();
  
  const isBodyShopCategory = (category) => {
    if (category && (category.includes('body') || category.includes('mechanic'))) {
      return category.includes('body');
    }
    return category.includes('body') || category.includes('paint') || category.includes('denting');
  };

  const trackerMechAssignments = trackerAssignments.filter(
    assignment => !isBodyShopCategory(getAssignmentCategory(assignment))
  );
  const trackerBodyshopAssignments = trackerAssignments.filter(
    assignment => isBodyShopCategory(getAssignmentCategory(assignment))
  );
  const getApprovalInterval = (approval) => {
    const status = String(approval.statusCode || approval.customerResponse || '').toUpperCase();
    const endAt = approval.respondedAt || (status.includes('PENDING') ? null : undefined);
    if (endAt === undefined) return null;
    return getTimeInterval(approval.sentAt || approval.createdAt, endAt);
  };
  const getApprovalDepartments = (approval) => {
    const categories = (approval.services || []).map(service =>
      String(service.categorySlug || service.categoryName || '').toLowerCase()
    );
    return [...new Set(categories.map(category =>
      isBodyShopCategory(category) ? 'body-shop' : 'mechanical'
    ))];
  };
  const getDepartmentApprovalIntervals = (department) => trackerApprovals
    .filter(approval => getApprovalDepartments(approval).includes(department))
    .map(getApprovalInterval)
    .filter(Boolean);
  const getAssignmentIntervals = (assignmentList) => assignmentList
    .map(assignment => getTimeInterval(assignment.assignedAt || assignment.startedAt, assignment.completedAt))
    .filter(Boolean);
  const getEarliestTimestamp = (values) => values
    .filter(value => value && Number.isFinite(new Date(value).getTime()))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] || null;
  const getLatestTimestamp = (values) => values
    .filter(value => value && Number.isFinite(new Date(value).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

  const mechAssignedAt = getEarliestTimestamp(trackerMechAssignments.map(a => a.assignedAt));
  const mechStartedAt = getEarliestTimestamp(trackerMechAssignments.map(a => a.startedAt));
  const mechStartFormatted = mechStartedAt ? formatTrackerDateTime(mechStartedAt) : 'Not started';
  const mechCompAt = trackerMechAssignments.length > 0 && trackerMechAssignments.every(a => !!a.completedAt)
    ? getLatestTimestamp(trackerMechAssignments.map(a => a.completedAt))
    : null;
  const timeInMechFormatted = getMergedDurationText([
    ...getAssignmentIntervals(trackerMechAssignments),
    ...getDepartmentApprovalIntervals('mechanical')
  ]);

  const bodyshopAssignedAt = getEarliestTimestamp(trackerBodyshopAssignments.map(a => a.assignedAt));
  const bodyshopStartedAt = getEarliestTimestamp(trackerBodyshopAssignments.map(a => a.startedAt));
  const bodyshopStartFormatted = bodyshopStartedAt ? formatTrackerDateTime(bodyshopStartedAt) : 'Not started';
  const bodyshopCompAt = trackerBodyshopAssignments.length > 0 && trackerBodyshopAssignments.every(a => !!a.completedAt)
    ? getLatestTimestamp(trackerBodyshopAssignments.map(a => a.completedAt))
    : null;
  const timeInBodyshopFormatted = getMergedDurationText([
    ...getAssignmentIntervals(trackerBodyshopAssignments),
    ...getDepartmentApprovalIntervals('body-shop')
  ]);

  const addlAssignments = trackerAssignments.filter(
    assignment => assignment.jobCardService?.isAdditional || assignment.service?.isAdditional
  );
  const addlApprovals = trackerApprovals.map(approval => ({ approval, interval: getApprovalInterval(approval) }));
  const addlStartAt = getEarliestTimestamp([
    ...addlAssignments.map(a => a.assignedAt),
    ...trackerApprovals.map(a => a.sentAt || a.createdAt)
  ]);
  const timeInAddlFormatted = getMergedDurationText([
    ...getAssignmentIntervals(addlAssignments),
    ...addlApprovals.map(item => item.interval)
  ]);
  const timeAwaitingCustomerFormatted = getMergedDurationText(
    addlApprovals.map(item => item.interval)
  );

  // Promised delivery: directly from jobCard.expectedDeliveryAt
  const deliveryTimeStr = jobCard?.expectedDeliveryAt || displayJobCard?.expectedDeliveryAt || jobCard?.expectedDeliveryDate;
  const promisedDeliveryFormatted = formatDateTimeShort(deliveryTimeStr);

  const computeTimeRemainingPill = () => {
    if (isJobDelivered) {
      return { text: 'Vehicle Delivered', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
    }
    if (!deliveryTimeStr) {
      return { text: 'Promised Delivery: Scheduled', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' };
    }
    const deliveryMs = new Date(deliveryTimeStr).getTime();
    if (isNaN(deliveryMs)) {
      return { text: 'Promised Delivery: Scheduled', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' };
    }
    const diffMs = deliveryMs - Date.now();
    if (diffMs <= 0) {
      const overdueMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
      const hrs = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      const overdueStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      return { text: `Overdue by ${overdueStr}`, color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    } else {
      const remMins = Math.floor(diffMs / (1000 * 60));
      const hrs = Math.floor(remMins / 60);
      const mins = remMins % 60;
      const remStr = hrs > 0 ? `${hrs}h ${String(mins).padStart(2, '0')}m` : `${mins}m`;
      return { text: `Time remaining: ${remStr} till delivery`, color: '#047857', bg: '#f0fdf4', border: '#bbf7d0' };
    }
  };
  const remainingPill = computeTimeRemainingPill();

  const supervisorNotesText = String(
    jobCard?.supervisorNotes ||
    jobCard?.supervisor_notes ||
    jobCard?.remarks ||
    jobCard?.advisorNotes ||
    jobCard?.additionalNotes ||
    jobCard?.notes ||
    ''
  ).trim();

  return (
    <Box sx={{ minHeight: '100%', p: { xs: 2, md: 4 } }}>
      {/* Top Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#1e3a8a', letterSpacing: '-0.01em' }}>
            {displayJobCard.vehicleNumber} — {displayJobCard.ownerName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.25 }}>
            Job Card: <strong>{displayJobCard.id}</strong>{' · '}{displayJobCard.vehicleBrandModel} {jobCard.vehicle?.color ? `· ${jobCard.vehicle.color}` : ''} {jobCard.vehicle?.fuelType ? `· ${jobCard.vehicle.fuelType}` : ''}{' · '}Created on {formatDateTime(displayJobCard.createdAt)}
          </Typography>
        </Box>
        <BackButton
          onClick={handleBack}
          label="Back to List"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Information details */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Customer & Vehicle Info */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', p: 3 }}>
              <Box sx={{ pb: 1.5, mb: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Car size={18} color="#dc2626" />
                <Typography variant="caption" fontWeight={800} sx={{ color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  VEHICLE & CUSTOMER DETAILS
                </Typography>
              </Box>

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
                        {getInitials(displayJobCard.ownerName)}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a', lineHeight: 1.2 }}>
                          {displayJobCard.ownerName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.25 }}>
                          {displayJobCard.ownerMobile}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Job Card No.:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#334155' }}>{displayJobCard.id}</Typography>
                        </Grid>
                      </Grid>

                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Entry Time:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                            {displayJobCard.createdAt ? formatDateTime(displayJobCard.createdAt) : '—'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Est. Delivery:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#0d9488' }}>
                            {displayJobCard.expectedDeliveryAt
                              ? formatDateTime(displayJobCard.expectedDeliveryAt)
                              : displayJobCard.expectedDeliveryDate
                                ? formatDateTime(displayJobCard.expectedDeliveryDate)
                                : '—'}
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
                      {displayJobCard.vehicleNumber}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Make/Model:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a' }}>{displayJobCard.vehicleBrandModel}</Typography>
                        </Grid>
                      </Grid>

                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Colour:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                            {jobCard.vehicle?.color || jobCard.vehicleColor || jobCard.color || 'White'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Fuel:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                            {jobCard.vehicle?.fuelType || jobCard.fuelType || 'Petrol'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Mechanic:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                            {assignedMechanicName}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Grid container spacing={1}>
                        <Grid item xs={5}>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>Bay:</Typography>
                        </Grid>
                        <Grid item xs={7}>
                          <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>
                            {assignedBayName}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Card>

            {/* Merged Services & Estimate Summary Card */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={18} color="#0d9488" />
                  <Typography variant="subtitle1" fontWeight={700}>Selected Services & Estimate Breakdown</Typography>
                </Box>
                <StatusBadge status={displayJobCard.status} />
              </Box>

              {/* Selected Initial Services Table */}
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ bgcolor: 'rgba(18, 52, 59, 0.02)', borderBottom: '1px solid #e2e8f0' }}>
                      <Box component="th" sx={{ p: 2, fontWeight: 600, textAlign: 'left', color: 'text.secondary' }}>Service Description</Box>
                      <Box component="th" sx={{ p: 2, fontWeight: 600, textAlign: 'right', color: 'text.secondary', width: 100 }}>Quantity</Box>
                      <Box component="th" sx={{ p: 2, fontWeight: 600, textAlign: 'center', color: 'text.secondary', width: 130 }}>Status</Box>
                      <Box component="th" sx={{ p: 2, fontWeight: 600, textAlign: 'right', color: 'text.secondary', width: 150 }}>Rate</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {defaultServices.length === 0 ? (
                      <Box component="tr">
                        <Box component="td" colSpan="4" sx={{ p: 3, textAlign: 'center', fontStyle: 'italic', color: 'text.disabled' }}>
                          No service items registered.
                        </Box>
                      </Box>
                    ) : (
                      defaultServices.map((service, index) => (
                        <Box component="tr" key={index} sx={{ borderBottom: index < defaultServices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <Box component="td" sx={{ p: 2, fontWeight: 500 }}>{service.name}</Box>
                          <Box component="td" sx={{ p: 2, textAlign: 'right', color: 'text.secondary' }}>x{service.quantity || 1}</Box>
                          <Box component="td" sx={{ p: 2, textAlign: 'center' }}>
                            <StatusBadge status={service.status} />
                          </Box>
                          <Box component="td" sx={{ p: 2, textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(service.price > 0 ? service.price : (index === 0 ? rawTotalSubtotal * 0.6 : rawTotalSubtotal * 0.4 / (defaultServices.length - 1 || 1)))}
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Additional Work & Services Sub-section */}
              {additionalServices.length > 0 && (
                <Box sx={{ borderTop: '1px solid #e2e8f0' }}>
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlusCircle size={16} color="#0d9488" />
                    <Typography variant="subtitle2" fontWeight={700}>Additional Work & Services</Typography>
                  </Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <Box component="tbody">
                        {additionalServices.map((service, index) => (
                          <Box component="tr" key={index} sx={{ borderBottom: index < additionalServices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <Box component="td" sx={{ p: 2, fontWeight: 500 }}>{service.name}</Box>
                            <Box component="td" sx={{ p: 2, textAlign: 'center' }}>
                              <StatusBadge status={service.status} />
                            </Box>
                            <Box component="td" sx={{ p: 2, textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(service.price)}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Estimate Summary Integrated Box */}
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" fontWeight={800} sx={{ color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ESTIMATE SUMMARY
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Base Subtotal</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatCurrency(baseSubtotal)}</Typography>
                </Box>

                {approvedAdditionalTotal > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Additional Work</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(approvedAdditionalTotal)}</Typography>
                  </Box>
                )}

                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Discount</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">-{formatCurrency(discountAmount)}</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Tax ({taxRate}%)</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatCurrency(totalTaxAmount)}</Typography>
                </Box>

                <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#1e3a8a' }}>Grand Total</Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: '#1e3a8a' }}>{formatCurrency(totalGrandTotal)}</Typography>
                </Box>
              </Box>
            </Card>

            {/* Complaints / Notes */}
            {noteItems.length > 0 && (
              <Card sx={{ borderRadius: 3 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Shield size={18} color="#0d9488" />
                  <Typography variant="subtitle1" fontWeight={700}>Additional Notes & Complaints</Typography>
                </Box>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {noteItems.map((item) => (
                    <Box key={item.label}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>)}
            {/* Additional Work Messages & Voice Notes */}
            {Array.isArray(jobCard?.approvals) && jobCard.approvals.some((a) => a.approvalType === 'ADDITIONAL_WORK' && (a.mechanicExplanation || a.voiceNoteUrl || (a.services && a.services.length > 0))) && (
              <Card sx={{ borderRadius: 3 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Mic size={18} color="#0d9488" />
                  <Typography variant="subtitle1" fontWeight={700}>Additional Work Messages & Voice Notes</Typography>
                </Box>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {jobCard.approvals.filter((a) => a.approvalType === 'ADDITIONAL_WORK' && (a.mechanicExplanation || a.voiceNoteUrl || (a.services && a.services.length > 0))).map((approval, idx) => {
                    const approvalStatus = approval.statusCode || approval.customerResponse || approval.status || 'PENDING';
                    const approvalServices = (approval.services && approval.services.length > 0)
                      ? approval.services
                      : (jobCard.services || []).filter((s) => s.isAdditional && (s.jobCardApprovalId === approval.id || s.approvalId === approval.id || s.approval_id === approval.id));

                    const approvalKey = approval.id || `approval-${idx}`;
                    const isExpanded = expandedApprovalIds[approvalKey] ?? (idx === 0);

                    const toggleExpand = () => {
                      setExpandedApprovalIds(prev => ({ ...prev, [approvalKey]: !isExpanded }));
                    };

                    return (
                      <Box key={approvalKey} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc', overflow: 'hidden' }}>
                        {/* Clickable Header Bar */}
                        <Box
                          onClick={toggleExpand}
                          sx={{
                            p: 2,
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1,
                            cursor: 'pointer',
                            userSelect: 'none',
                            bgcolor: isExpanded ? '#ffffff' : '#f8fafc',
                            borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                            '&:hover': { bgcolor: '#f1f5f9' },
                            transition: 'all 0.15s ease-in-out'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: isExpanded ? '#0d9488' : '#e2e8f0',
                              color: isExpanded ? '#ffffff' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.2s ease-in-out'
                            }}>
                              {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {approval.approvalCode ? `Approval Request: ${approval.approvalCode}` : `Additional Work Request #${idx + 1}`}
                            </Typography>
                            <StatusBadge status={approvalStatus} />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {approval.createdAt && (
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(approval.createdAt)}
                              </Typography>
                            )}
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(); }} sx={{ color: '#64748b' }}>
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Expandable Content (Services, Text Message, Voice Note) */}
                        {isExpanded && (
                          <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#f8fafc' }}>
                            {/* Additional Work Name & Accept/Reject Status */}
                            {approvalServices && approvalServices.length > 0 && (
                              <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                  Requested Additional Services
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {approvalServices.map((srv, sIdx) => (
                                    <Box key={sIdx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                                        {srv.serviceName || srv.name}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        {srv.price > 0 && (
                                          <Typography variant="body2" fontWeight={700} sx={{ color: '#334155' }}>
                                            {formatCurrency(srv.price)}
                                          </Typography>
                                        )}
                                        <StatusBadge status={srv.statusCode || srv.status || approvalStatus} />
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            )}

                            {approval.mechanicExplanation && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                  Explanation / Message
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#1e293b', bgcolor: '#ffffff', p: 1.5, borderRadius: 1, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                                  {approval.mechanicExplanation}
                                </Typography>
                              </Box>
                            )}

                            {approval.voiceNoteUrl && (
                              <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Mic size={16} /> Recorded Voice Note Audio:
                                </Typography>
                                <audio controls src={approval.voiceNoteUrl} style={{ width: '100%', height: 40 }} />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            )}

          </Box>
        </Grid>

        {/* Right Column: Invoice stats */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 80 }}>

            {/* JOB PROGRESS Timeline Card */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', p: 3, bgcolor: '#ffffff' }}>
              <Box
                onClick={() => setIsJobProgressOpen(prev => !prev)}
                sx={{
                  pb: isJobProgressOpen ? 2 : 0,
                  mb: isJobProgressOpen ? 2.5 : 0,
                  borderBottom: isJobProgressOpen ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapPin size={16} color="#ef4444" />
                  <Typography variant="caption" fontWeight={800} sx={{ color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    JOB PROGRESS
                  </Typography>
                </Box>
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: isJobProgressOpen ? '#0d9488' : '#e2e8f0',
                  color: isJobProgressOpen ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease-in-out'
                }}>
                  {isJobProgressOpen ? <Minus size={16} /> : <Plus size={16} />}
                </Box>
              </Box>

              {isJobProgressOpen && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                  {timelineSteps.map((step, index) => {
                    const isLast = index === timelineSteps.length - 1;

                    return (
                      <Box key={step.id || index} sx={{ display: 'flex', gap: 2, position: 'relative', pb: isLast ? 0 : 2.5 }}>
                        {/* Connecting Vertical Line */}
                        {!isLast && (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 10,
                              top: 22,
                              bottom: 0,
                              width: 2,
                              bgcolor: step.state === 'completed' ? '#a7f3d0' : '#e2e8f0',
                              zIndex: 0
                            }}
                          />
                        )}

                        {/* Icon Circle */}
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            bgcolor: '#ffffff',
                            border: step.state === 'completed'
                              ? '2px solid #10b981'
                              : step.state === 'active'
                                ? '2px solid #2563eb'
                                : step.state === 'in_progress'
                                  ? '2px solid #d97706'
                                  : '2px solid #cbd5e1',
                            boxShadow: step.state === 'active'
                              ? '0 0 0 3px rgba(37, 99, 235, 0.15)'
                              : step.state === 'in_progress'
                                ? '0 0 0 3px rgba(217, 119, 6, 0.15)'
                                : 'none',
                            flexShrink: 0,
                            mt: 0.25
                          }}
                        >
                          <Box
                            sx={{
                              width: (step.state === 'active' || step.state === 'in_progress') ? 10 : 8,
                              height: (step.state === 'active' || step.state === 'in_progress') ? 10 : 8,
                              borderRadius: '50%',
                              bgcolor: step.state === 'completed'
                                ? '#10b981'
                                : step.state === 'active'
                                  ? '#2563eb'
                                  : step.state === 'in_progress'
                                    ? '#d97706'
                                    : '#cbd5e1'
                            }}
                          />
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              color: step.state === 'completed' || step.state === 'active' || step.state === 'in_progress' ? '#0f172a' : '#64748b',
                              lineHeight: 1.2
                            }}
                          >
                            {step.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: step.state === 'in_progress' ? '#d97706' : '#64748b',
                              display: 'block',
                              mt: 0.3,
                              fontWeight: step.state === 'in_progress' ? 600 : 500,
                              fontSize: '0.78rem'
                            }}
                          >
                            {step.subtitle}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Card>

            {/* TIME TRACKER Card */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', p: 3, bgcolor: '#ffffff' }}>
              <Box
                onClick={() => setIsTimeTrackerOpen(prev => !prev)}
                sx={{
                  pb: isTimeTrackerOpen ? 2 : 0,
                  mb: isTimeTrackerOpen ? 2.5 : 0,
                  borderBottom: isTimeTrackerOpen ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={16} color="#64748b" />
                  <Typography variant="caption" fontWeight={800} sx={{ color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    TIME TRACKER
                  </Typography>
                </Box>
                <Box sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: isTimeTrackerOpen ? '#0d9488' : '#e2e8f0',
                  color: isTimeTrackerOpen ? '#ffffff' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease-in-out'
                }}>
                  {isTimeTrackerOpen ? <Minus size={16} /> : <Plus size={16} />}
                </Box>
              </Box>

              {isTimeTrackerOpen && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Time at gate</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace, sans-serif', textAlign: 'right' }}>{gateTimeFormatted}</Typography>
                  </Box>

                  {hasMechanicalWork && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Mech assigned</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace, sans-serif', textAlign: 'right' }}>{mechAssignedAt ? formatTrackerDateTime(mechAssignedAt) : '—'}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Mech started</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace, sans-serif', textAlign: 'right' }}>{mechStartFormatted}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Time in mech (elapsed)</Typography>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#d97706', fontFamily: 'monospace, sans-serif' }}>{timeInMechFormatted}</Typography>
                          {mechCompAt && <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>ended {formatTrackerDateTime(mechCompAt)}</Typography>}
                        </Box>
                      </Box>
                    </>
                  )}

                  {hasBodyshopWork && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Body Shop assigned</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace, sans-serif', textAlign: 'right' }}>{bodyshopAssignedAt ? formatTrackerDateTime(bodyshopAssignedAt) : '—'}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Body Shop started</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#0f172a', fontFamily: 'monospace, sans-serif', textAlign: 'right' }}>{bodyshopStartFormatted}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Time in Body Shop (elapsed)</Typography>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#d97706', fontFamily: 'monospace, sans-serif' }}>{timeInBodyshopFormatted}</Typography>
                          {bodyshopCompAt && <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>ended {formatTrackerDateTime(bodyshopCompAt)}</Typography>}
                        </Box>
                      </Box>
                    </>
                  )}

                  {addlAssignments.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Additional work elapsed</Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#d97706', fontFamily: 'monospace, sans-serif' }}>{timeInAddlFormatted}</Typography>
                        {addlStartAt && <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>from {formatTrackerDateTime(addlStartAt)}</Typography>}
                      </Box>
                    </Box>
                  )}

                  {addlApprovals.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1, borderBottom: '1px solid #f8fafc' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Customer approval wait</Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#d97706', fontFamily: 'monospace, sans-serif' }}>{timeAwaitingCustomerFormatted}</Typography>
                        {addlApprovals.map(({ approval }, index) => (
                          <Typography key={approval.id || index} variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                            {formatTrackerDateTime(approval.sentAt || approval.createdAt)} to {approval.respondedAt ? formatTrackerDateTime(approval.respondedAt) : 'Awaiting response'}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>Promised delivery</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#2563eb', fontFamily: 'monospace, sans-serif', textAlign: 'right' }}>{promisedDeliveryFormatted}</Typography>
                  </Box>

                  {/* Bottom Highlight Pill */}
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: remainingPill.bg,
                      borderRadius: 2,
                      border: `1px solid ${remainingPill.border}`,
                      textAlign: 'center',
                      mt: 0.5
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ color: remainingPill.color, fontSize: '0.85rem' }}>
                      {remainingPill.text}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Box
                onClick={() => setIsAssignedWorkOpen(prev => !prev)}
                sx={{
                  p: 2.5,
                  borderBottom: isAssignedWorkOpen ? '1px solid' : 'none',
                  borderColor: 'divider',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a' }}>Assigned Mechanical Work</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip
                    label={`${assignmentDetails.length} Assignment${assignmentDetails.length === 1 ? '' : 's'}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: '#e0e7ff',
                      color: '#4338ca',
                      fontSize: '0.75rem',
                      px: 0.5
                    }}
                  />
                  <Box sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: isAssignedWorkOpen ? '#0d9488' : '#e2e8f0',
                    color: isAssignedWorkOpen ? '#ffffff' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    {isAssignedWorkOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </Box>
                </Box>
              </Box>
              {isAssignedWorkOpen && (
                <Box sx={{ p: 2.5 }}>
                  {assignmentDetails.length === 0 ? (
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No mechanical assignment added for this job card yet.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {assignmentDetails.map((assignment, index) => {
                        const assignedUser = assignment.assignedUser || {};
                        const serviceName = assignment.jobCardService?.serviceName || assignment.service?.serviceName || 'Assigned Service';
                        const assignmentId = assignment.id || `assignment-${index}`;
                        const defaultExpandedId = assignmentDetails[0]?.id || `assignment-0`;
                        const activeId = expandedAssignmentId !== null ? expandedAssignmentId : defaultExpandedId;
                        const isExpanded = activeId === assignmentId;

                        const toggleExpanded = () => {
                          setExpandedAssignmentId(isExpanded ? '' : assignmentId);
                        };

                        const statusLabel = getAssignmentStatusLabel(assignment);
                        const statusValue = getAssignmentStatusValue(assignment);

                        return (
                          <Box
                            key={assignmentId}
                            sx={{
                              border: '1px solid',
                              borderColor: '#e2e8f0',
                              borderRadius: '12px',
                              p: 2.5,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                              boxShadow: isExpanded ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025)' : 'none',
                              bgcolor: '#ffffff',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            {/* Top Header Row */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {/* Avatar Icon */}
                                <Box sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  bgcolor: '#eff6ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#2563eb'
                                }}>
                                  <User size={20} />
                                </Box>
                                {/* Name & Task */}
                                <Box>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b', fontSize: '0.95rem' }}>
                                    {serviceName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                                    {assignedUser.fullName || 'Unassigned'} {assignedUser.employeeCode ? ` - ${assignedUser.employeeCode}` : ''}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Status Dot & Chevron */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {/* Dot Badge */}
                                <Box sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.75,
                                  bgcolor: statusValue === 'ON_HOLD' ? '#fee2e2' : statusValue === 'COMPLETED' ? '#dcfce7' : statusValue === 'IN_PROGRESS' ? '#eff6ff' : '#ffedd5',
                                  color: statusValue === 'ON_HOLD' ? '#991b1b' : statusValue === 'COMPLETED' ? '#166534' : statusValue === 'IN_PROGRESS' ? '#1e40af' : '#c2410c',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}>
                                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusValue === 'ON_HOLD' ? '#b91c1c' : statusValue === 'COMPLETED' ? '#15803d' : statusValue === 'IN_PROGRESS' ? '#1d4ed8' : '#ea580c' }} />
                                  {statusLabel}
                                </Box>

                                {/* Collapse/Expand toggle */}
                                <IconButton
                                  size="small"
                                  onClick={toggleExpanded}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: '#e2e8f0',
                                    borderRadius: '8px',
                                    p: 0.5,
                                    color: '#64748b'
                                  }}
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Collapsible Content */}
                            {isExpanded && (
                              <>
                                {/* Start Time & End Time Box */}
                                <Box sx={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  border: '1px solid',
                                  borderColor: '#f1f5f9',
                                  bgcolor: '#f8fafc',
                                  borderRadius: '12px',
                                  overflow: 'hidden'
                                }}>
                                  {/* Start Time */}
                                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderRight: '1px solid', borderColor: '#f1f5f9' }}>
                                    <Box sx={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                                      <Clock size={20} />
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase' }}>
                                        Start Time
                                      </Typography>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b', mt: 0.25 }}>
                                        {assignment.startedAt ? formatDateTime(assignment.startedAt) : 'Not Started'}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  {/* End Time */}
                                  <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ color: '#8b5cf6', display: 'flex', alignItems: 'center' }}>
                                      <Clock size={20} />
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase' }}>
                                        End Time
                                      </Typography>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b', mt: 0.25 }}>
                                        {assignment.completedAt ? formatDateTime(assignment.completedAt) : 'Not Started'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>

                                <Divider sx={{ borderColor: '#f1f5f9' }} />

                                {/* Footer Action and Details */}
                                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 4 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ClipboardList size={18} color="#6366f1" />
                                    <Box>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>
                                        Work Order
                                      </Typography>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: '#334155' }}>
                                        {assignedUser.employeeCode || '—'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Wrench size={18} color="#6366f1" />
                                    <Box>
                                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>
                                        Task
                                      </Typography>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: '#334155' }}>
                                        {serviceName}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  {statusValue === 'ON_HOLD' ? (
                                    <Button
                                      size="sm"
                                      variant="outlined"
                                      leftIcon={PlayCircle}
                                      onClick={() => {
                                        setResumeModal({ isOpen: true, item: { ...assignment, category: assignment.jobCardService?.serviceItem?.category?.slug || assignment.service?.category?.slug || 'mechanical' } });
                                        setSelectedMechanic('');
                                        setSelectedBay('');
                                      }}
                                      sx={{ borderColor: '#10b981', color: '#10b981', '&:hover': { bgcolor: '#10b981', color: 'white' } }}
                                    >
                                      Resume
                                    </Button>
                                  ) : (statusValue === 'ASSIGNED' || statusValue === 'IN_PROGRESS') ? (
                                    <Button
                                      size="sm"
                                      variant="outlined"
                                      leftIcon={PauseCircle}
                                      onClick={() => {
                                        setPostponeModal({ isOpen: true, item: assignment });
                                        setPostponeReason('');
                                      }}
                                      sx={{ borderColor: '#f59e0b', color: '#f59e0b', '&:hover': { bgcolor: '#f59e0b', color: 'white' } }}
                                    >
                                      Postpone
                                    </Button>
                                  ) : null}
                                </Box>
                              </Box> */}
                              </>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </Card>

            {/* Vehicle Photos Gallery Card */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', p: 3, bgcolor: '#ffffff' }}>
              <Box
                onClick={() => setIsInspectionPhotosOpen(prev => !prev)}
                sx={{
                  pb: isInspectionPhotosOpen ? 1.5 : 0,
                  mb: isInspectionPhotosOpen ? 2.5 : 0,
                  borderBottom: isInspectionPhotosOpen ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon size={18} color="#2563eb" />
                    <Typography variant="subtitle1" fontWeight={700}>Vehicle Inspection & Photos</Typography>
                  </Box>
                  <Box sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: isInspectionPhotosOpen ? '#0d9488' : '#e2e8f0',
                    color: isInspectionPhotosOpen ? '#ffffff' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    {isInspectionPhotosOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={`${vehiclePhotos.length} Photo${vehiclePhotos.length === 1 ? '' : 's'}`} size="small" sx={{ fontWeight: 700, bgcolor: vehiclePhotos.length > 0 ? '#eff6ff' : '#f1f5f9', color: vehiclePhotos.length > 0 ? '#2563eb' : '#64748b', fontSize: '0.75rem' }} />
                  {vehiclePhotos.length > 0 && isInspectionPhotosOpen && (
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b' }}>
                      Click photo for full screen
                    </Typography>
                  )}
                </Box>
              </Box>

              {isInspectionPhotosOpen && (
                vehiclePhotos.length === 0 ? (
                  <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#f8fafc' }}>
                    <ImageIcon size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#475569' }}>
                      No Vehicle Photos Uploaded
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Inspection photos uploaded during CRM job card creation will appear here.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Main Photo Preview Box */}
                    <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: '#0f172a', height: { xs: 200, sm: 240 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box
                        component="img"
                        src={vehiclePhotos[activePhotoIdx]?.url}
                        alt={vehiclePhotos[activePhotoIdx]?.category || 'Vehicle Photo'}
                        onClick={() => setIsPhotoLightboxOpen(true)}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                      />

                      {/* Left Carousel Arrow */}
                      {vehiclePhotos.length > 1 && (
                        <IconButton
                          onClick={(e) => { e.stopPropagation(); setActivePhotoIdx((prev) => (prev - 1 + vehiclePhotos.length) % vehiclePhotos.length); }}
                          sx={{ position: 'absolute', left: 8, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#ffffff' }, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                          size="small"
                        >
                          <ChevronLeft size={18} color="#0f172a" />
                        </IconButton>
                      )}

                      {/* Right Carousel Arrow */}
                      {vehiclePhotos.length > 1 && (
                        <IconButton
                          onClick={(e) => { e.stopPropagation(); setActivePhotoIdx((prev) => (prev + 1) % vehiclePhotos.length); }}
                          sx={{ position: 'absolute', right: 8, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#ffffff' }, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                          size="small"
                        >
                          <ChevronRight size={18} color="#0f172a" />
                        </IconButton>
                      )}

                      {/* Bottom Category Label */}
                      {vehiclePhotos[activePhotoIdx]?.category && (
                        <Chip
                          label={vehiclePhotos[activePhotoIdx].category}
                          size="small"
                          sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(15, 23, 42, 0.75)', color: '#ffffff', fontWeight: 600, fontSize: '0.7rem', backdropFilter: 'blur(4px)' }}
                        />
                      )}
                    </Box>

                    {/* Thumbnails Row */}
                    {vehiclePhotos.length > 1 && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
                        {vehiclePhotos.map((photo, idx) => (
                          <Box
                            key={photo.id || idx}
                            onClick={() => setActivePhotoIdx(idx)}
                            sx={{
                              width: 60,
                              height: 48,
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: activePhotoIdx === idx ? '2px solid #2563eb' : '2px solid transparent',
                              opacity: activePhotoIdx === idx ? 1 : 0.65,
                              transition: 'all 0.15s ease',
                              flexShrink: 0,
                              bgcolor: '#0f172a'
                            }}
                          >
                            <Box
                              component="img"
                              src={photo.url}
                              alt={photo.category || `Thumbnail ${idx + 1}`}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </>
                )
              )}
            </Card>

            {/* Fullscreen Modal Lightbox */}
            {isPhotoLightboxOpen && vehiclePhotos.length > 0 && (
              <Modal
                show={isPhotoLightboxOpen}
                onHide={() => setIsPhotoLightboxOpen(false)}
                title=""
                size="lg"
              >
                <Box sx={{ position: 'relative', width: '100%', minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a', borderRadius: 2, p: 2 }}>
                  {/* Close X Button */}
                  <IconButton
                    onClick={() => setIsPhotoLightboxOpen(false)}
                    sx={{ position: 'absolute', top: 12, right: 12, color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, zIndex: 10 }}
                  >
                    <X size={20} />
                  </IconButton>

                  {/* Main Fullscreen Image */}
                  <Box sx={{ width: '100%', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box
                      component="img"
                      src={vehiclePhotos[activePhotoIdx]?.url}
                      alt={vehiclePhotos[activePhotoIdx]?.category || 'Vehicle Photo Fullscreen'}
                      sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: 1.5 }}
                    />
                  </Box>

                  {/* Navigation Arrows */}
                  {vehiclePhotos.length > 1 && (
                    <IconButton
                      onClick={() => setActivePhotoIdx((prev) => (prev - 1 + vehiclePhotos.length) % vehiclePhotos.length)}
                      sx={{ position: 'absolute', left: 16, top: '45%', color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                    >
                      <ChevronLeft size={28} />
                    </IconButton>
                  )}

                  {vehiclePhotos.length > 1 && (
                    <IconButton
                      onClick={() => setActivePhotoIdx((prev) => (prev + 1) % vehiclePhotos.length)}
                      sx={{ position: 'absolute', right: 16, top: '45%', color: '#ffffff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                    >
                      <ChevronRight size={28} />
                    </IconButton>
                  )}

                  {/* Category Badge & Index */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                      {activePhotoIdx + 1} of {vehiclePhotos.length}
                    </Typography>
                    {vehiclePhotos[activePhotoIdx]?.category && (
                      <Chip label={vehiclePhotos[activePhotoIdx].category} size="small" sx={{ bgcolor: '#2563eb', color: '#ffffff', fontWeight: 700 }} />
                    )}
                  </Box>

                  {/* Thumbnails Strip in Lightbox */}
                  {vehiclePhotos.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2, overflowX: 'auto', maxWidth: '90%', pb: 1 }}>
                      {vehiclePhotos.map((photo, idx) => (
                        <Box
                          key={photo.id || idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          sx={{
                            width: 64,
                            height: 52,
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: activePhotoIdx === idx ? '2px solid #2563eb' : '2px solid transparent',
                            opacity: activePhotoIdx === idx ? 1 : 0.5,
                            flexShrink: 0
                          }}
                        >
                          <Box component="img" src={photo.url} alt={`Thumb ${idx}`} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Modal>
            )}

          </Box>
        </Grid>
      </Grid>

      <Modal
        show={postponeModal.isOpen}
        onHide={() => setPostponeModal({ isOpen: false, item: null })}
        title="Postpone Service"
        confirmLabel="Confirm Postpone"
        onConfirm={() => {
          if (!postponeReason.trim()) {
            toastError("Reason is required to postpone a service");
            return;
          }
          postponeMutation.mutate({
            serviceId: postponeModal.item?.jobCardServiceId || postponeModal.item?.serviceId,
            payload: { reason: postponeReason }
          });
        }}
        isConfirming={postponeMutation.isPending}
      >
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Postponing this service will release the currently assigned bay. Please provide a reason for the delay.
          </Typography>
          <TextField
            label="Reason for postponement"
            multiline
            rows={3}
            fullWidth
            value={postponeReason}
            onChange={(e) => setPostponeReason(e.target.value)}
            placeholder="e.g. Waiting for spare parts..."
            required
          />
        </Box>
      </Modal>

      <Modal
        show={resumeModal.isOpen}
        onHide={() => setResumeModal({ isOpen: false, item: null })}
        title="Resume Service"
        confirmLabel="Confirm Resume"
        onConfirm={() => {
          if (!selectedMechanic || !selectedBay) {
            toastError("Please select a mechanic and a bay");
            return;
          }
          resumeMutation.mutate({
            serviceId: resumeModal.item?.jobCardServiceId || resumeModal.item?.serviceId,
            payload: { bayId: Number(selectedBay), mechanicId: Number(selectedMechanic) }
          });
        }}
        isConfirming={resumeMutation.isPending}
      >
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Resuming this service will reassign it and lock the bay.
          </Typography>

          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>Mechanic</InputLabel>
            <Select
              value={selectedMechanic}
              label="Mechanic"
              onChange={(e) => setSelectedMechanic(e.target.value)}
              sx={{ borderRadius: 2 }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              {isMechanicsLoading && <MenuItem disabled value="">Loading mechanics...</MenuItem>}
              {!isMechanicsLoading && mechanics.length === 0 && <MenuItem disabled value="">No active mechanics found</MenuItem>}
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
                          height: 20, fontSize: '0.68rem', fontWeight: 700,
                          bgcolor: isBusy ? '#FEF3C7' : '#DCFCE7',
                          color: isBusy ? '#B45309' : '#15803D',
                          border: '1px solid',
                          borderColor: isBusy ? '#FCD34D' : '#86EFAC'
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
              value={selectedBay}
              label="Bay"
              onChange={(e) => setSelectedBay(e.target.value)}
              sx={{ borderRadius: 2 }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              {isBaysLoading && <MenuItem disabled value="">Loading bays...</MenuItem>}
              {!isBaysLoading && bays.length === 0 && <MenuItem disabled value="">No active bays found</MenuItem>}
              {bays.map((bay) => {
                const isBusy = bay.availability === 'BUSY';
                const statusText = bay.availabilityLabel || (isBusy ? 'Busy' : 'Available');
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
                          height: 20, fontSize: '0.68rem', fontWeight: 700,
                          bgcolor: isBusy ? '#FEF3C7' : '#DCFCE7',
                          color: isBusy ? '#B45309' : '#15803D',
                          border: '1px solid',
                          borderColor: isBusy ? '#FCD34D' : '#86EFAC'
                        }}
                      />
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      </Modal>

    </Box>
  );
}
