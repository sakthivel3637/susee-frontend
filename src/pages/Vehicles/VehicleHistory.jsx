import { Box, Card, Grid, Typography, Chip } from '@mui/material';
import { ArrowLeft, Calendar, FileText, IndianRupee, Wrench, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { ROUTES } from '../../config/routes';
import { useVehicleHistory } from '../../queries/useDataQueries';
import Loader from '../../components/common/Loader';

export default function VehicleHistory() {
  const { slug, id } = useParams();
  const identifier = slug || id;
  const navigate = useNavigate();
  const { data: history = [], isLoading } = useVehicleHistory(identifier);

  if (isLoading) return <Loader fullPage text="Loading service history..." />;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Service History"
        subtitle={identifier ? `Viewing history for vehicle ${identifier}` : 'Vehicle service records and previous job cards'}
        breadcrumbs={[{ label: 'Vehicles', path: ROUTES.VEHICLES }, { label: 'History' }]}
        actions={
          identifier && (
            <Button variant="back" leftIcon={ArrowLeft} onClick={() => navigate(`${ROUTES.VEHICLES}`)}>
              Back to Vehicle List
            </Button>
          )
        }
      />

      {/* History List */}
      <Box sx={{ display: 'grid', gap: 3 }}>
        {history.length === 0 && (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
              No service history found for this vehicle.
            </Typography>
          </Card>
        )}
        {history.map((job) => (
          <Card
            key={job.id}
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Header info */}
            <Box
              sx={{
                px: 3,
                py: 2.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                borderBottom: '1px solid #f1f5f9',
                background: 'linear-gradient(to right, #f8fafc, #ffffff)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: '8px', bgcolor: '#eff6ff', color: '#2563eb' }}>
                  <FileText size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#1e293b', fontWeight: 800 }}>
                    {job.id}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Clock size={12} /> Date: {job.date}
                  </Typography>
                </Box>
              </Box>
              <StatusBadge status={job.status} />
            </Box>

            {/* Content body */}
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase' }}>
                    Services Rendered
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {job.services?.length ? (
                      job.services.map((service, index) => (
                        <Chip
                          key={index}
                          label={service}
                          icon={<Wrench size={12} />}
                          sx={{
                            bgcolor: '#f1f5f9',
                            color: '#334155',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            '& .MuiChip-icon': { color: '#64748b' }
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No services specified</Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
                    Total Cost
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5 }}>
                    <IndianRupee size={20} color="#10b981" />
                    {job.cost.toLocaleString('en-IN')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Card Footer Actions */}
            <Box
              sx={{
                px: 3,
                py: 2,
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'flex-end',
                bgcolor: '#fafafa'
              }}
            >
              <Button
                size="sm"
                variant="outline"
                leftIcon={FileText}
                onClick={() => navigate(`/job-cards/view/${job.slug || job.id}`, { state: { fromVehicleHistory: true } })}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    bgcolor: '#f1f5f9'
                  }
                }}
              >
                View Full Details
              </Button>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
