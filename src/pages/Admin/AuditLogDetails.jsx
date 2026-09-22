import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, Typography, Grid, Divider, CircularProgress } from '@mui/material';
import { ArrowLeft, Calendar, Copy, Hash, Database, User, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { ROUTES } from '../../config/routes';
import { formatDateTime } from '../../utils/formatters';
import { useAuditLogDetail } from '../../queries/useAuditLogQueries';

const toFieldLabel = (value) => {
  if (!value) return '-';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function AuditLogDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: apiResponse, isLoading, isError, error } = useAuditLogDetail(id);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const detail = apiResponse?.data?.auditLog;

  if (isError || !detail) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Typography color="error">Error loading audit log details: {error?.message || 'Not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Audit Log Details"
        breadcrumbs={[
          { label: 'Audit Logs', path: ROUTES.ADMIN_AUDIT_LOGS },
          { label: `Log #${detail.id}` }
        ]}
        actions={
          <Button variant="back" leftIcon={ArrowLeft} onClick={() => navigate(ROUTES.ADMIN_AUDIT_LOGS)}>
            Back to Audit Logs
          </Button>
        }
      />
      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', p: { xs: 3, md: 5 } }}>

        {/* Section 1: Header row */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3, pb: 3, borderBottom: '1px solid #F1F5F9', mb: 4 }}>
          {/* Left: Audit Event */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Audit Event
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
              {detail.actionType} {detail.tableName}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#64748B', mt: 0.5 }}>
              Record: {detail.recordName}
            </Typography>
          </Box>

          {/* Right Area: Created At */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#EFF6FF', color: '#2563EB', display: 'grid', placeItems: 'center' }}>
                <Calendar size={18} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                  Created At
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {formatDateTime(detail.performedAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Section 2: Middle details grid */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#F8FAFC', color: '#64748B', display: 'grid', placeItems: 'center', border: '1px solid #E2E8F0', flexShrink: 0 }}>
              <Hash size={20} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                Detail ID
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {detail.id}
              </Typography>
            </Box>
          </Grid> */}

          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#F8FAFC', color: '#64748B', display: 'grid', placeItems: 'center', border: '1px solid #E2E8F0', flexShrink: 0 }}>
              <Database size={20} />
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {detail.tableName}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#F8FAFC', color: '#64748B', display: 'grid', placeItems: 'center', border: '1px solid #E2E8F0', flexShrink: 0 }}>
              <User size={20} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                Changed By
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {detail.performedBy?.fullName || 'System'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Section 3: Change Summary Divider Pill */}
        <Box sx={{ position: 'relative', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Divider sx={{ width: '100%', position: 'absolute', zIndex: 1 }} />
          <Box sx={{
            bgcolor: '#EFF6FF',
            color: '#1E3A8A',
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            px: 3,
            py: 1,
            borderRadius: 9999,
            border: '1px solid #DBEAFE',
            zIndex: 2,
            position: 'relative'
          }}>
            Change Summary
          </Box>
        </Box>

        {/* Section 4: Old vs New Values Compare */}
        {detail.details && detail.details.length > 0 ? (
          detail.details.map((fieldChange) => (
            <Box key={fieldChange.id} sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                {toFieldLabel(fieldChange.fieldName)}
              </Typography>
              <Grid container spacing={3} alignItems="center">
                {/* Old Value Box */}
                <Grid item xs={12} md={5.5}>
                  <Box sx={{ borderRadius: 2, border: '1px solid #FEE2E2', overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#FEF2F2', px: 2.5, py: 1.25, borderBottom: '1px solid #FEE2E2' }}>
                      <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Old Value
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2.5, bgcolor: '#FFFFFF', minHeight: '80px', display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1E293B', fontWeight: 500 }}>
                        {fieldChange.oldValue === null ? 'null' : String(fieldChange.oldValue)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Arrow */}
                <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid #E2E8F0',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#64748B',
                    bgcolor: '#FFFFFF',
                    transform: { xs: 'rotate(90deg)', md: 'none' }
                  }}>
                    <ArrowRight size={18} />
                  </Box>
                </Grid>

                {/* New Value Box */}
                <Grid item xs={12} md={5.5}>
                  <Box sx={{ borderRadius: 2, border: '1px solid #DBEAFE', overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: '#EFF6FF', px: 2.5, py: 1.25, borderBottom: '1px solid #DBEAFE' }}>
                      <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        New Value
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2.5, bgcolor: '#FFFFFF', minHeight: '80px', display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1E293B', fontWeight: 700 }}>
                        {fieldChange.newValue === null ? 'null' : String(fieldChange.newValue)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: 'center', color: '#64748B' }}>
            <Typography>No specific field changes recorded for this action.</Typography>
          </Box>
        )}

      </Card>
    </Box>
  );
}
