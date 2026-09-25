import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Grid, Card, Typography, Divider, Chip, IconButton, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { ArrowLeft, ArrowRight, Car, User, Shield, FileText, AlertTriangle, PlusCircle, Clock, ChevronDown, ChevronUp, ClipboardList, Wrench, Play, Filter, PauseCircle, PlayCircle, Mic } from 'lucide-react';
import { useJobCard } from '../../queries/useDataQueries';
import StatusBadge from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
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
      navigate(ROUTES.JOB_CARDS);
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
    jobCard.vehicle?.model,
    jobCard.vehicle?.variant
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

  const allServices = displayJobCard.services || [];
  const defaultServices = allServices.filter(s => !s.isAdditional);
  const additionalServices = allServices.filter(s => s.isAdditional);
  const noteItems = [
    displayJobCard.complaint ? { label: 'Customer Complaint', value: displayJobCard.complaint } : null,
    displayJobCard.additionalNotes ? { label: 'Additional Notes', value: displayJobCard.additionalNotes } : null,
    displayJobCard.notes ? { label: 'Notes', value: displayJobCard.notes } : null
  ].filter(Boolean);

  const taxRate = jobCard.billing?.taxRate ?? jobCard.taxRate ?? 18;
  const totalSubtotal = jobCard.billing?.serviceSubtotal ?? jobCard.serviceSubtotal ?? (displayJobCard.estimatedCost / (1 + taxRate / 100));
  const approvedAdditionalTotal = additionalServices
    .filter(s => s.status !== 'REJECTED')
    .reduce((sum, s) => sum + s.price, 0);

  const discountAmount = jobCard.billing?.discountAmount ?? jobCard.discountAmount ?? 0;
  const taxableAmount = Math.max(0, totalSubtotal - discountAmount);
  const totalTaxAmount = (taxableAmount * (taxRate / 100));
  const totalGrandTotal = taxableAmount + totalTaxAmount;

  return (
    <Box sx={{ minHeight: '100%', p: { xs: 2, md: 4 } }}>
      {/* Page Header */}
      <PageHeader
        title={`Job Card: ${displayJobCard.id}`}
        subtitle={`Created on ${formatDateTime(displayJobCard.createdAt)}`}
        breadcrumbs={[{ label: 'Job Cards', path: ROUTES.JOB_CARDS }, { label: 'View Details' }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>

            <Button variant="back" leftIcon={ArrowLeft} onClick={handleBack}>
              Back
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        {/* Left Column: Information details */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Customer & Vehicle Info */}
            <Card sx={{ borderRadius: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Car size={18} color="#0d9488" />
                <Typography variant="subtitle1" fontWeight={700}>Vehicle & Owner Details</Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Owner Name</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <User size={15} color="#6b7280" />
                      {displayJobCard.ownerName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Mobile Number</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {displayJobCard.ownerMobile}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Registration Number</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {displayJobCard.vehicleNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Brand & Model</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {displayJobCard.vehicleBrandModel}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Expected Delivery Date</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0d9488' }}>
                      <Clock size={15} color="#0d9488" />
                      {displayJobCard.expectedDeliveryAt ? formatDateTime(displayJobCard.expectedDeliveryAt) : displayJobCard.expectedDeliveryDate ? formatDateTime(displayJobCard.expectedDeliveryDate) : '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Service Type</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {displayJobCard.serviceType || 'Regular Service'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* Selected Work Items */}
            <Card sx={{ borderRadius: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText size={18} color="#0d9488" />
                <Typography variant="subtitle1" fontWeight={700}>Selected Services</Typography>
              </Box>
              <Box sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 300 }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ bgcolor: 'rgba(18, 52, 59, 0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
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
                        <Box component="tr" key={index} sx={{ borderBottom: index < defaultServices.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Box component="td" sx={{ p: 2, fontWeight: 500 }}>{service.name}</Box>
                          <Box component="td" sx={{ p: 2, textAlign: 'right', color: 'text.secondary' }}>x{service.quantity || 1}</Box>
                          <Box component="td" sx={{ p: 2, textAlign: 'center' }}>
                            <StatusBadge status={service.status} />
                          </Box>
                          <Box component="td" sx={{ p: 2, textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(service.price > 0 ? service.price : (index === 0 ? totalSubtotal * 0.6 : totalSubtotal * 0.4 / (defaultServices.length - 1 || 1)))}
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Additional Work & Services */}
            {additionalServices.length > 0 && (
              <Card sx={{ borderRadius: 0 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlusCircle size={18} color="#0d9488" />
                  <Typography variant="subtitle1" fontWeight={700}>Additional Work & Services</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ bgcolor: 'rgba(18, 52, 59, 0.02)', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box component="th" sx={{ p: 2, fontWeight: 600, textAlign: 'left', color: 'text.secondary' }}>Service Description</Box>
                        <Box component="th" sx={{ p: 2, fontWeight: 600, textAlign: 'center', color: 'text.secondary', width: 120 }}>Status</Box>
                        <Box component="th" sx={{ p: 2, fontWeight: 600, textAlign: 'right', color: 'text.secondary', width: 150 }}>Rate</Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {additionalServices.length === 0 ? (
                        <Box component="tr">
                          <Box component="td" colSpan="3" sx={{ p: 3, textAlign: 'center', fontStyle: 'italic', color: 'text.disabled' }}>
                            No additional services registered.
                          </Box>
                        </Box>
                      ) : (
                        additionalServices.map((service, index) => (
                          <Box component="tr" key={index} sx={{ borderBottom: index < additionalServices.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                            <Box component="td" sx={{ p: 2, fontWeight: 500 }}>{service.name}</Box>
                            <Box component="td" sx={{ p: 2, textAlign: 'center' }}>
                              <StatusBadge status={service.status} />
                            </Box>
                            <Box component="td" sx={{ p: 2, textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(service.price)}
                            </Box>
                          </Box>
                        ))
                      )}
                    </Box>
                  </Box>
                </Box>
              </Card>
            )}

            {/* Complaints / Notes */}
            {noteItems.length > 0 && (
              <Card sx={{ borderRadius: 0 }}>
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
           {/* {Additional Work Messages & Voice Notes} */}
            {Array.isArray(jobCard?.approvals) && jobCard.approvals.some((a) => a.mechanicExplanation || a.voiceNoteUrl) && (
              <Card sx={{ borderRadius: 0 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Mic size={18} color="#0d9488" />
                  <Typography variant="subtitle1" fontWeight={700}>Additional Work Messages & Voice Notes</Typography>
                </Box>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {jobCard.approvals.filter((a) => a.mechanicExplanation || a.voiceNoteUrl).map((approval, idx) => (
                    <Box key={approval.id || idx} sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {approval.approvalCode ? `Approval Request: ${approval.approvalCode}` : `Additional Work Request #${idx + 1}`}
                        </Typography>
                        {approval.createdAt && (
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(approval.createdAt)}
                          </Typography>
                        )}
                      </Box>

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
                  ))}
                </Box>
              </Card>
            )}

          </Box>
        </Grid>

        {/* Right Column: Invoice stats */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 80 }}>

            {/* Status & Estimate Overview */}
            <Card sx={{ borderRadius: 0 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700}>Estimate Summary</Typography>
                <StatusBadge status={displayJobCard.status} />
              </Box>
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Base Subtotal</Typography>
                    <Typography variant="body2">{formatCurrency(Math.max(0, totalSubtotal - approvedAdditionalTotal))}</Typography>
                  </Box>
                  {approvedAdditionalTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Additional Work</Typography>
                      <Typography variant="body2">{formatCurrency(approvedAdditionalTotal)}</Typography>
                    </Box>
                  )}
                  {discountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Discount</Typography>
                      <Typography variant="body2" color="success.main">-{formatCurrency(discountAmount)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Tax ({taxRate}%)</Typography>
                    <Typography variant="body2">{formatCurrency(totalTaxAmount)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'primary.main' }}>
                    <Typography variant="subtitle1" fontWeight={800}>Grand Total</Typography>
                    <Typography variant="subtitle1" fontWeight={800}>{formatCurrency(totalGrandTotal)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                </Box>
              </Box>
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
            </Card>

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

          <FormControl fullWidth size="small">
            <InputLabel>Select Mechanic</InputLabel>
            <Select
              value={selectedMechanic}
              label="Select Mechanic"
              onChange={(e) => setSelectedMechanic(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              {isMechanicsLoading && <MenuItem disabled value="">Loading mechanics...</MenuItem>}
              {!isMechanicsLoading && mechanics.length === 0 && <MenuItem disabled value="">No active mechanics found</MenuItem>}
              {mechanics.map((mechanic) => (
                <MenuItem key={mechanic.id} value={mechanic.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {mechanic.fullName}{mechanic.employeeCode ? ` (${mechanic.employeeCode})` : ''}
                    </Typography>
                    <Chip
                      size="small"
                      label={mechanic.availabilityLabel || (mechanic.activeJobCount > 0 ? `Busy (${mechanic.activeJobCount})` : 'Available')}
                      sx={{
                        height: 22, fontSize: '0.68rem', fontWeight: 800,
                        bgcolor: mechanic.activeJobCount > 0 ? '#FEF3C7' : '#DCFCE7',
                        color: mechanic.activeJobCount > 0 ? '#B45309' : '#15803D'
                      }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Bay Number</InputLabel>
            <Select
              value={selectedBay}
              label="Bay Number"
              onChange={(e) => setSelectedBay(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              {isBaysLoading && <MenuItem disabled value="">Loading bays...</MenuItem>}
              {!isBaysLoading && bays.length === 0 && <MenuItem disabled value="">No active bays found</MenuItem>}
              {bays.map((bay) => {
                const isBusy = bay.availability === 'BUSY';
                return (
                  <MenuItem key={bay.id} value={bay.id} disabled={isBusy}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {bay.bayName || bay.bayCode}
                      </Typography>
                      <Chip
                        size="small"
                        label={bay.availabilityLabel || (isBusy ? 'Busy' : 'Available')}
                        sx={{
                          height: 22, fontSize: '0.68rem', fontWeight: 800,
                          bgcolor: isBusy ? '#FEF3C7' : '#DCFCE7',
                          color: isBusy ? '#B45309' : '#15803D'
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
