import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Card,
  Divider,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  X,
  Car,
  User,
  FileText,
  PlusCircle,
  Shield,
  ExternalLink,
  ArrowRight,
  Clock,
  Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useJobCard } from '../../queries/useDataQueries';
import StatusBadge from './StatusBadge';
import Loader from './Loader';
import Button from './Button';
import VehicleNumberPlate from './VehicleNumberPlate';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../config/routes';

export default function JobCardDetailModal({
  isOpen,
  onClose,
  jobCardId,
  approvalData,
  onAssign
}) {
  const navigate = useNavigate();
  const { data: jobCard, isLoading } = useJobCard(jobCardId);

  if (!isOpen) return null;

  const handleOpenFullPage = () => {
    onClose();
    navigate(`${ROUTES.JOB_CARDS}/view/${jobCard?.slug || jobCard?.id || jobCardId}`);
  };

  const vehicleBrandModel = jobCard?.vehicle
    ? [jobCard.vehicle.brand?.name, jobCard.vehicle.model, jobCard.vehicle.variant].filter(Boolean).join(' ')
    : jobCard?.makeModel || jobCard?.vehicleModel || '—';

  const customerName = jobCard?.customer?.fullName || jobCard?.ownerName || 'Unknown';
  const customerMobile = jobCard?.customer?.mobileNo || jobCard?.ownerMobile || jobCard?.mobile || '—';
  const vehicleNumber = jobCard?.vehicle?.registrationNo || jobCard?.vehicleNumber || '—';
  const complaintText = String(jobCard?.customerComplaint || '').trim();
  const additionalNotesText = String(jobCard?.additionalNotes || '').trim();
  const legacyNotesText = !complaintText && !additionalNotesText ? String(jobCard?.notes || '').trim() : '';
  const allApprovals = Array.isArray(jobCard?.approvals) && jobCard.approvals.length > 0
    ? jobCard.approvals
    : (approvalData ? [approvalData] : []);
  const validApprovals = allApprovals.filter(a => a && (a.mechanicExplanation || a.mechanic_explanation || a.voiceNoteUrl || a.voice_note_url));

  const services = Array.isArray(jobCard?.services) && typeof jobCard.services[0] === 'string'
    ? jobCard.services.map(s => ({ name: s, price: 0, quantity: 1, status: 'PENDING', isAdditional: false }))
    : (jobCard?.services?.map(s => ({
      name: s.serviceName || s.serviceItem?.name || 'Unknown Service',
      price: Number(s.price || 0),
      quantity: Number(s.quantity || 1),
      status: s.serviceStatus?.statusCode || 'PENDING',
      isAdditional: !!s.isAdditional
    })) || []);

  const defaultServices = services.filter(s => !s.isAdditional);
  const additionalServices = services.filter(s => s.isAdditional);

  const taxRate = jobCard?.billing?.taxRate ?? jobCard?.taxRate ?? 18;
  const totalSubtotal = jobCard?.billing?.serviceSubtotal ?? jobCard?.serviceSubtotal ?? ((jobCard?.totalEstimate || 0) / (1 + taxRate / 100));
  const approvedAdditionalTotal = additionalServices
    .filter(s => s.status !== 'REJECTED')
    .reduce((sum, s) => sum + s.price, 0);

  const discountAmount = jobCard?.billing?.discountAmount ?? jobCard?.discountAmount ?? 0;
  const taxableAmount = Math.max(0, totalSubtotal - discountAmount);
  const totalTaxAmount = (taxableAmount * (taxRate / 100));
  const totalGrandTotal = taxableAmount + totalTaxAmount;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          maxHeight: '90vh'
        }
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#0F172A' }}>
            {jobCard?.jobCardNo || `Job Card #${jobCardId}`}
          </Typography>
          {jobCard?.currentStatus?.statusCode && (
            <StatusBadge status={jobCard.currentStatus.statusCode} />
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#64748B',
            bgcolor: '#F1F5F9',
            '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A' }
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {/* Modal Content */}
      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC', overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <Loader text="Loading job card details..." />
          </Box>
        ) : !jobCard ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Could not load job card details.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Vehicle and Customer Info Card */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 1.5, bgcolor: '#F0FDFA', color: '#0D9488' }}>
                  <Car size={18} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                  Vehicle & Owner Details
                </Typography>
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                      Registration Number
                    </Typography>
                    <VehicleNumberPlate vehicleNumber={vehicleNumber} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                      Brand & Model
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#1E293B' }}>
                      {vehicleBrandModel}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ borderTop: '1px solid #F1F5F9', pt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                      Customer Name
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1E293B' }}>
                      <User size={15} color="#64748B" />
                      {customerName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ borderTop: '1px solid #F1F5F9', pt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                      Mobile Number
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#1E293B' }}>
                      {customerMobile}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ borderTop: '1px solid #F1F5F9', pt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                      Expected Delivery Date
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0D9488' }}>
                      <Clock size={15} color="#0D9488" />
                      {jobCard?.expectedDeliveryAt ? formatDateTime(jobCard.expectedDeliveryAt) : jobCard?.expectedDeliveryDate ? formatDateTime(jobCard.expectedDeliveryDate) : '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ borderTop: '1px solid #F1F5F9', pt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                      Service Type
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#1E293B' }}>
                      {jobCard?.gateEntry?.entryType || jobCard?.serviceType || 'Regular Service'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* Customer Complaint & Notes */}
            {(complaintText || additionalNotesText || legacyNotesText) && (
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#FFFFFF' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 1.5, bgcolor: '#FFF1F2', color: '#E11D48' }}>
                    <Shield size={18} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                    Customer Complaint & Notes
                  </Typography>
                </Box>
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {complaintText && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Customer Complaint
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1E293B', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                        {complaintText}
                      </Typography>
                    </Box>
                  )}
                  {additionalNotesText && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Additional Notes
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1E293B', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                        {additionalNotesText}
                      </Typography>
                    </Box>
                  )}
                  {legacyNotesText && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1E293B', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                        {legacyNotesText}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            )}

            {/* Mechanic Explanation & Recorded Voice Notes Card */}
            {validApprovals.length > 0 && (
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#FFFFFF' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 1.5, bgcolor: '#ECFDF5', color: '#059669' }}>
                    <Mic size={18} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                    Mechanic Explanation & Voice Records ({validApprovals.length})
                  </Typography>
                </Box>
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {validApprovals.map((approval, idx) => {
                    const text = String(approval.mechanicExplanation || approval.mechanic_explanation || '').trim();
                    const audio = approval.voiceNoteUrl || approval.voice_note_url || null;
                    return (
                      <Box key={approval.id || idx} sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {approval.approvalCode ? `Approval Request: ${approval.approvalCode}` : `Request #${idx + 1}`}
                        </Typography>
                        {text && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                              Explanation / Note
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1E293B', bgcolor: '#FFFFFF', p: 1.5, borderRadius: 1.5, border: '1px solid #E2E8F0', whiteSpace: 'pre-wrap' }}>
                              {text}
                            </Typography>
                          </Box>
                        )}
                        {audio && (
                          <Box sx={{ p: 1.5, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Mic size={16} /> Recorded Voice Note Audio:
                            </Typography>
                            <audio controls src={audio} style={{ width: '100%', height: 40 }} />
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Card>
            )}

            {/* Selected Services Table */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#FFFFFF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 1.5, bgcolor: '#EFF6FF', color: '#2563EB' }}>
                  <FileText size={18} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                  Selected Services ({defaultServices.length})
                </Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>Service Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>Qty</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {defaultServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94A3B8', fontStyle: 'italic' }}>
                        No standard service items registered.
                      </TableCell>
                    </TableRow>
                  ) : (
                    defaultServices.map((service, idx) => (
                      <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background-color 0.2s' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#1E293B', py: 1.5 }}>{service.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#64748B', py: 1.5 }}>x{service.quantity || 1}</TableCell>
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <StatusBadge status={service.status} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A', py: 1.5 }}>
                          {formatCurrency(service.price)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Additional Work & Services */}
            {additionalServices.length > 0 && (
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#FFFFFF' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 1.5, bgcolor: '#F3E8FF', color: '#9333EA' }}>
                    <PlusCircle size={18} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0F172A' }}>
                    Additional Work & Services ({additionalServices.length})
                  </Typography>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>Description</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5 }}>Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {additionalServices.map((service, idx) => (
                      <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F8FAFC' }, transition: 'background-color 0.2s' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#1E293B', py: 1.5 }}>{service.name}</TableCell>
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <StatusBadge status={service.status} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A', py: 1.5 }}>
                          {formatCurrency(service.price)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Estimate Summary Box */}
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', p: 2.5, boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.1)', border: 'none' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                    Subtotal
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                    {formatCurrency(totalSubtotal || 0)}
                  </Typography>
                </Box>
                {discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                      Discount
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#34D399', fontWeight: 600 }}>
                      -{formatCurrency(discountAmount)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                    GST ({taxRate}%)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                    +{formatCurrency(totalTaxAmount || 0)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.15)', borderStyle: 'dashed' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight={700} sx={{ color: '#FFFFFF' }}>
                    Estimated Total
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    {formatCurrency(totalGrandTotal || jobCard?.totalEstimate || 0)}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        )}
      </DialogContent>

      {/* Modal Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Button
          variant="outlined"
          size="sm"
          leftIcon={ExternalLink}
          onClick={handleOpenFullPage}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Open Full Page
        </Button>
        {/* 
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
          >
            Close
          </Button>
          {onAssign && (
            <Button
              variant="primary"
              size="sm"
              rightIcon={ArrowRight}
              onClick={() => {
                onClose();
                onAssign();
              }}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Assign Work
            </Button>
          )}
        </Box> */}
      </DialogActions>
    </Dialog>
  );
}
