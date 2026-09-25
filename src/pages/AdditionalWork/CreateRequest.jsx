import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Card, Checkbox, Chip, Divider, FormControlLabel, Grid, TextField, Typography, } from '@mui/material';
import { ArrowLeft, Car, ClipboardList, MessageCircle, MessageSquare, Mic, Send, Wrench, } from 'lucide-react';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import VehicleNumberPlate from '../../components/common/VehicleNumberPlate';
import { createAdditionalWorkRequestApi, getAdditionalWorkContextApi } from '../../api/jobCardApi';
import { toastError, toastSuccess } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import { formatCurrency, formatDate, formatPhone, snakeToLabel } from '../../utils/formatters';

const TAX_RATE = 0;

function normalizePayload(payload) {
  return payload?.data?.data || payload?.data || payload || null;
}

function serviceRows(jobCard) {
  const services = jobCard?.jobCardServices || jobCard?.services || [];

  if (!Array.isArray(services)) return [];

  return services.map((service, index) => {
    if (typeof service === 'string') {
      const subtotal = Number(jobCard?.estimatedCost || 0) / (1 + TAX_RATE / 100) / Math.max(services.length, 1);
      return {
        id: `${service}-${index}`,
        name: service,
        category: jobCard?.serviceType ? snakeToLabel(jobCard.serviceType) : 'Mechanical',
        qty: 1,
        price: Math.round(subtotal),
        status: index === 0 ? 'In Progress' : 'Approved',
      };
    }

    return {
      id: service.id || index,
      name: service.serviceName || service.name || service.description || 'Service item',
      category: service.categoryName || service.category || 'Mechanical',
      qty: service.quantity || 1,
      price: Number(service.priceSnapshot || service.price || service.amount || 0),
      status: service.approvalStatus?.name || service.approvalStatus?.code || service.serviceStatus?.name || service.serviceStatus?.code || service.status || 'Approved',
    };
  });
}

function InfoItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700, mt: 0.5 }}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

function SectionCard({ icon: Icon, title, children, action }) {
  return (
    <Card sx={{ borderRadius: 0, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
      <Box sx={{ p: 2.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon size={18} color="#0F766E" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
            {title}
          </Typography>
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Card>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <Typography variant="body2" sx={{ mb: 1, color: '#1E293B', fontWeight: 800 }}>
      {children} {required && <Typography component="span" sx={{ color: '#E11D48', fontWeight: 900 }}>*</Typography>}
    </Typography>
  );
}

function LiveVoiceRecorder({ onRecorded, onClear, recorderRef }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const stopRecordingInternal = () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          onRecorded(reader.result, previewUrl);
          resolve(reader.result);
        };

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorderRef.current.stop();
    });
  };

  useEffect(() => {
    if (recorderRef) {
      recorderRef.current = {
        isRecording: () => isRecording,
        stopAndGetAudio: stopRecordingInternal,
      };
    }
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toastError('Live microphone recording is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          onRecorded(reader.result, previewUrl);
        };

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toastError('Microphone permission is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      stopRecordingInternal();
    }
  };

  const resetRecording = () => {
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onClear();
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Mic size={18} color="#059669" /> Live Voice Note Recorder
      </Typography>

      {!isRecording && !audioPreviewUrl && (
        <Button
          type="button"
          onClick={startRecording}
          sx={{
            height: 44,
            bgcolor: '#DC2626',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.85rem',
            borderRadius: '6px',
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxShadow: '0 2px 4px rgba(220,38,38,0.25)',
            '&:hover': { bgcolor: '#B91C1C' }
          }}
        >
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FFFFFF' }} />
          Click to Record
        </Button>
      )}

      {isRecording && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#FEF2F2', border: '1px solid #FCA5A5', p: 1.5, borderRadius: '6px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#DC2626' }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#991B1B' }}>
              Recording live... {formatTimer(recordingSeconds)}
            </Typography>
          </Box>
          <Button
            type="button"
            onClick={stopRecording}
            sx={{
              bgcolor: '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
              px: 2,
              py: 0.75,
              borderRadius: '4px',
              textTransform: 'none',
              '&:hover': { bgcolor: '#334155' }
            }}
          >
            Stop Recording
          </Button>
        </Box>
      )}

      {audioPreviewUrl && !isRecording && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#059669' }}>
            Recorded Audio Preview:
          </Typography>
          <audio controls src={audioPreviewUrl} style={{ width: '100%', height: 38 }} />
          <Button
            type="button"
            onClick={resetRecording}
            sx={{
              color: '#DC2626',
              fontWeight: 700,
              fontSize: '0.75rem',
              alignSelf: 'flex-start',
              p: 0,
              textTransform: 'none',
              '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' }
            }}
          >
            Re-record Voice Note
          </Button>
        </Box>
      )}
    </Box>
  );
}

export function AdditionalWorkRequestScreen({
  domainLabel,
  defaultCategory = 'mechanical',
  listRoute = ROUTES.FLOOR_ADDITIONAL_WORK,
  backRoute = ROUTES.JOB_CARDS,
  emptyMessage,
  subtitle,
  successMessage,
  sendButtonLabel,
  vehicleSectionTitle,
  currentItemsTitle,
  assigneeLabel,
  additionalBillLabel,
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobCardId = searchParams.get('jobCardId');
  const categoryParam = searchParams.get('category') || searchParams.get('department') || defaultCategory;

  const { data: contextPayload, isLoading } = useQuery({
    queryKey: ['additional-work-context', jobCardId, categoryParam],
    queryFn: () => getAdditionalWorkContextApi(jobCardId, { category: categoryParam }),
    enabled: Boolean(jobCardId),
  });
  const context = normalizePayload(contextPayload);
  const activeDepartment = String(context?.department || categoryParam || 'mechanical').toLowerCase();
  const isBodyShopDept = activeDepartment === 'body-shop' || activeDepartment === 'bodyshop';

  const resolvedDomainLabel = domainLabel || (isBodyShopDept ? 'Body Shop Additional Work' : 'Additional Work');
  const resolvedSendButtonLabel = sendButtonLabel || (isBodyShopDept ? 'Approve Body Shop Work' : 'Approve Additional Work');
  const resolvedBillLabel = additionalBillLabel || (isBodyShopDept ? 'Body Shop Additional Work' : 'Additional Work');
  const resolvedSubtitle = subtitle || (isBodyShopDept ? 'Review vehicle details, current job card work, then approve one batch for body shop additional work.' : 'Review the vehicle, current job card, then send one approval batch for the extra work.');
  const resolvedSuccessMessage = successMessage || (isBodyShopDept ? 'Body shop additional work approved successfully.' : 'Additional work approved successfully.');
  const resolvedVehicleTitle = vehicleSectionTitle || (isBodyShopDept ? 'Body Shop Vehicle and Customer Details' : 'Vehicle and Customer Details');
  const resolvedCurrentTitle = currentItemsTitle || (isBodyShopDept ? 'Current Body Shop Job Items' : 'Current Job Card Items');
  const resolvedEmptyMessage = emptyMessage || (isBodyShopDept ? 'Open a body shop job card to create additional body work against that vehicle.' : 'Open a job card from the Job Cards action menu to create additional work against that vehicle.');

  const jobCardRaw = context?.jobCard || null;
  const jobCard = jobCardRaw || {
    id: jobCardId || 'Unknown',
    ownerName: 'Unknown Customer',
    ownerMobile: '',
    vehicleNumber: 'Not captured',
    status: 'PENDING',
    services: []
  };

  const [parentJobCardServiceId, setParentJobCardServiceId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [mechanicExplanation, setMechanicExplanation] = useState('');
  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState([]);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const recorderRef = useRef(null);

  const currentServices = useMemo(() => serviceRows({ services: context?.currentServices || jobCard.services || [] }), [context?.currentServices, jobCard.services]);
  const eligibleParentServices = useMemo(() => serviceRows({ services: context?.eligibleParentServices || [] }), [context?.eligibleParentServices]);
  const availableServices = useMemo(() => {
    const services = Array.isArray(context?.availableServices) ? context.availableServices : [];
    const currentServiceNames = new Set(currentServices.map((s) => s.name?.toLowerCase().trim()));
    return services.filter((service) => !currentServiceNames.has(service.name?.toLowerCase().trim()));
  }, [context?.availableServices, currentServices]);
  const pendingApproval = context?.pendingApproval || null;
  const jobCardTaxRate = Number(jobCard.taxRate ?? jobCard.billing?.taxRate ?? TAX_RATE);
  const jobCardDiscountAmount = Number(jobCard.discountAmount ?? jobCard.billing?.discountAmount ?? 0);
  const baseSubtotal = currentServices.reduce((sum, service) => sum + Number(service.price || 0) * Number(service.qty || 1), 0);
  const additionalSubtotal = selectedAdditionalServices.reduce((sum, service) => sum + Number(service.price || 0), 0);
  const subtotal = baseSubtotal + additionalSubtotal;
  const taxableAmount = Math.max(0, subtotal - jobCardDiscountAmount);
  const tax = taxableAmount * (jobCardTaxRate / 100);
  const total = taxableAmount + tax;

  useEffect(() => {
    if (!parentJobCardServiceId && eligibleParentServices.length) {
      setParentJobCardServiceId(String(eligibleParentServices[0].id));
    }
  }, [eligibleParentServices, parentJobCardServiceId]);

  const toggleAdditionalService = (service) => {
    setSelectedAdditionalServices((current) => {
      const isSelected = current.some((item) => item.id === service.id);
      return isSelected ? current.filter((item) => item.id !== service.id) : [...current, service];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!jobCardRaw && !jobCardId) {
      toastError('Select a job card before creating additional work.');
      return;
    }

    if (!selectedAdditionalServices.length) {
      toastError('Select at least one additional work service.');
      return;
    }

    if (!parentJobCardServiceId) {
      toastError('Select the current service that needs additional work.');
      return;
    }

    if (mechanicExplanation.trim().length < 5) {
      toastError('Enter the mechanic explanation for the customer approval message.');
      return;
    }

    try {
      setIsSending(true);

      let finalVoiceNoteUrl = voiceNoteUrl;
      if (recorderRef.current && recorderRef.current.isRecording()) {
        const recordedAudio = await recorderRef.current.stopAndGetAudio();
        if (recordedAudio) {
          finalVoiceNoteUrl = recordedAudio;
        }
      }

      const response = await createAdditionalWorkRequestApi(jobCardId, {
        category: defaultCategory,
        parentJobCardServiceId: Number(parentJobCardServiceId),
        expectedDeliveryAt: expectedDelivery || undefined,
        mechanicExplanation: mechanicExplanation.trim(),
        voiceNoteUrl: finalVoiceNoteUrl && finalVoiceNoteUrl.trim() ? finalVoiceNoteUrl.trim() : undefined,
        serviceItems: selectedAdditionalServices.map((service) => ({
          serviceItemId: service.serviceItemId || service.id,
          quantity: 1,
        })),
      });
      await queryClient.invalidateQueries({ queryKey: ['additional-work-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      toastSuccess(response?.message || resolvedSuccessMessage || 'Additional work approved successfully.');
      navigate(listRoute);
    } catch (error) {
      toastError(error?.message || 'Unable to send additional work approval.');
    } finally {
      setIsSending(false);
    }
  };

  if (!jobCardId) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <PageHeader
          title={`Request ${resolvedDomainLabel}`}
          breadcrumbs={[{ label: resolvedDomainLabel, path: listRoute }, { label: 'New Request' }]}
        />
        <Alert severity="info" sx={{ mt: 2, borderRadius: 0 }}>
          {resolvedEmptyMessage}
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return <Loader fullPage text="Loading job card details..." />;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 4 }, bgcolor: '#F4F6F9', minHeight: '100%' }}>
      <PageHeader
        title={`${resolvedDomainLabel} / ${jobCard.jobCardNo || jobCard.slug || jobCard.id}`}
        subtitle={resolvedSubtitle}
        breadcrumbs={[{ label: resolvedDomainLabel, path: listRoute }, { label: jobCard.jobCardNo || jobCard.slug || jobCard.id }]}
        actions={
          <Button variant="back" leftIcon={ArrowLeft} onClick={() => navigate(backRoute)}>
            Back to Job Cards
          </Button>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <SectionCard icon={Car} title={resolvedVehicleTitle}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#2563EB', color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                      {(jobCard.ownerName || 'C').slice(0, 1)}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{jobCard.ownerName}</Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>{formatPhone(jobCard.ownerMobile || jobCard.mobile)}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <VehicleNumberPlate vehicleNumber={jobCard.vehicleNumber} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <InfoItem label="Job Card" value={jobCard.jobCardNo} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <InfoItem label="Created" value={formatDate(jobCard.createdAt)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoItem label="Brand / Model" value={jobCard.makeModel || jobCard.vehicleInfo || 'Not captured'} />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard icon={ClipboardList} title={resolvedCurrentTitle}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ bgcolor: '#F8FAFC' }}>
                      {['#', 'Service Item', 'Category', 'Price', 'Qty', 'Status'].map((heading) => (
                        <Box component="th" key={heading} sx={{ p: 1.5, color: '#64748B', fontSize: '0.75rem', textAlign: heading === 'Price' ? 'right' : 'left' }}>
                          {heading}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {currentServices.map((service, index) => (
                      <Box component="tr" key={service.id} sx={{ borderBottom: '1px solid #E2E8F0' }}>
                        <Box component="td" sx={{ p: 1.5 }}>{String(index + 1).padStart(2, '0')}</Box>
                        <Box component="td" sx={{ p: 1.5, fontWeight: 700 }}>{service.name}</Box>
                        <Box component="td" sx={{ p: 1.5 }}>
                          <Chip label={service.category} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }} />
                        </Box>
                        <Box component="td" sx={{ p: 1.5, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(service.price)}</Box>
                        <Box component="td" sx={{ p: 1.5 }}>x{service.qty}</Box>
                        <Box component="td" sx={{ p: 1.5 }}><StatusBadge status={service.status} /></Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </SectionCard>

            <SectionCard icon={Wrench} title="Additional Work">
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <FieldLabel required>Expected Delivery</FieldLabel>
                  <TextField fullWidth type="datetime-local" value={expectedDelivery} onChange={(event) => setExpectedDelivery(event.target.value)} required sx={{ '& .MuiInputBase-root': { height: 56, bgcolor: '#FFFFFF' } }} />
                  <Box sx={{ mt: 1.5 }}>
                    <LiveVoiceRecorder
                      recorderRef={recorderRef}
                      onRecorded={(recordedDataUrl) => setVoiceNoteUrl(recordedDataUrl)}
                      onClear={() => setVoiceNoteUrl('')}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FieldLabel required>Mechanic Explanation</FieldLabel>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={3}
                    placeholder="Explain why this extra work is needed"
                    value={mechanicExplanation}
                    onChange={(event) => setMechanicExplanation(event.target.value)}
                    sx={{ '& .MuiInputBase-root': { bgcolor: '#FFFFFF' } }}
                  />
                </Grid>
              </Grid>

              {!eligibleParentServices.length && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 0 }}>
                  No active service is available in this department for additional work.
                </Alert>
              )}

              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, color: '#334155', textTransform: 'uppercase' }}>
                Available Services
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {availableServices.length ? availableServices.map((service) => {
                  const isSelected = selectedAdditionalServices.some((item) => item.id === service.id);
                  return (
                    <Box
                      key={service.id}
                      onClick={() => toggleAdditionalService(service)}
                      sx={{ p: 2, minHeight: 66, borderRadius: 2, border: '1px solid', borderColor: isSelected ? '#0F766E' : '#E2E8F0', bgcolor: isSelected ? '#ECFDF5' : '#FFFFFF', cursor: 'pointer', transition: 'border-color 0.2s, background-color 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, }}
                    >
                      <FormControlLabel
                        onClick={(event) => event.stopPropagation()}
                        control={
                          <Checkbox checked={isSelected} onChange={() => toggleAdditionalService(service)} sx={{ color: '#0F172A', '&.Mui-checked': { color: '#0F766E' } }} />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={800} sx={{ color: '#0F172A' }}>
                              {service.name}
                            </Typography>
                            <Chip label={service.category} size="small" sx={{ height: 22, fontSize: '0.68rem', bgcolor: '#F1F5F9', color: '#0F172A', fontWeight: 700 }} />
                          </Box>
                        }
                        sx={{ m: 0, flex: 1 }}
                      />
                      <Typography variant="body2" fontWeight={900} sx={{ color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {formatCurrency(service.price)}
                      </Typography>
                    </Box>
                  );
                }) : (
                  <Alert severity="info" sx={{ gridColumn: '1 / -1', borderRadius: 0 }}>
                    No active service items found for this department.
                  </Alert>
                )}
              </Box>
            </SectionCard>
          </Box>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: { lg: 'sticky' }, top: 88 }}>
            <SectionCard icon={MessageCircle} title="Approval Preview">
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontWeight: 800 }}>Bill Preview</Typography>
              </Box>

              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, maxHeight: { xs: 420, lg: 'calc(100vh - 300px)' }, minHeight: 180, overflowY: 'auto', pr: 1, mr: -1, scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 8 }, '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }, }}
              >
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>
                  Previous Job Card Bill
                </Typography>
                {currentServices.length ? (
                  currentServices.map((service) => (
                    <Box key={service.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {service.name} <Typography component="span" variant="caption" color="text.secondary">x{service.qty}</Typography>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatCurrency(Number(service.price || 0) * Number(service.qty || 1))}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                    No previous services found for this job card.
                  </Typography>
                )}

                <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>
                  {resolvedBillLabel}
                </Typography>
                {selectedAdditionalServices.length ? (
                  selectedAdditionalServices.map((service) => (
                    <Box key={service.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {service.name} <Typography component="span" variant="caption" color="text.secondary">x1</Typography>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{formatCurrency(service.price)}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                    Select additional services to add them here.
                  </Typography>
                )}

                <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Previous Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(baseSubtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{resolvedBillLabel}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(additionalSubtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(subtotal)}</Typography>
                </Box>
                {jobCardDiscountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Discount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>-{formatCurrency(jobCardDiscountAmount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Tax ({jobCardTaxRate}%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(tax)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 900 }}>Approval Total</Typography>
                  <Typography sx={{ fontWeight: 900, color: '#0F766E' }}>{formatCurrency(total)}</Typography>
                </Box>
              </Box>
              {pendingApproval && (
                <Alert severity="info" sx={{ mt: 2.5, borderRadius: 0 }}>
                  Pending approval {pendingApproval.approvalCode ? `(${pendingApproval.approvalCode})` : ''} is already waiting for customer response.
                </Alert>
              )}
              <Button fullWidth type="submit" variant="primary" leftIcon={Send} isLoading={isSending} disabled={!eligibleParentServices.length} sx={{ mt: 2.5 }}>
                {resolvedSendButtonLabel}
              </Button>
            </SectionCard>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function CreateRequest() {
  const [searchParams] = useSearchParams();
  const categoryParam = String(searchParams.get('category') || searchParams.get('department') || '').toLowerCase();

  return (
    <AdditionalWorkRequestScreen
      defaultCategory={categoryParam || 'mechanical'}
      listRoute={ROUTES.FLOOR_ADDITIONAL_WORK}
      backRoute={ROUTES.JOB_CARDS}
    />
  );
}
