import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, IconButton, Menu, MenuItem, Select, Chip } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import { Plus, Eye, Edit, MoreVertical, PlusCircle, MessageCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useJobCards, useJobCardStatuses } from '../../queries/useDataQueries';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import PageHeader from '../../components/shared/PageHeader';
import VehicleNumberPlate from '../../components/common/VehicleNumberPlate';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { ROUTES } from '../../config/routes';
import useAuthStore from '../../store/useAuthStore';
import { getDepartmentFromModules, hasReadableModule } from '../../utils/authAccess';
import DateFilter from '../../components/common/DateFilter';
import ResetFiltersButton from '../../components/common/ResetFiltersButton';
import { usePermissions } from '../../hooks/usePermissions';
import { exportJobCardsExcelApi } from '../../api/jobCardApi';

const PRIORITY_COLORS = {
  LOW: '#10B981',
  NORMAL: '#3B82F6',
  HIGH: '#F59E0B',
  URGENT: '#EF4444',
};

export default function JobCardList() {
  const navigate = useNavigate();
  const { menus } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const debouncedSearch = useDebounce(search, 300);
  const { canRead, canCreate, canUpdate } = usePermissions();
  const canReadJobCards = canRead('/job-cards');
  const canCreateJobCards = canCreate('/job-cards');
  const canUpdateJobCards = canUpdate('/job-cards');
  const canCreateFloorAdditionalWork = canCreate('/additional-work');
  const canCreateBodyShopAdditionalWork = canCreate('/body-shop-additional-work');
  const department = getDepartmentFromModules(menus);
  const canCreateJobCard = canCreateJobCards && !['body-shop', 'water-wash'].includes(department);
  const departmentFilter = ['body-shop', 'water-wash'].includes(department) ? department : undefined;

  const { data: statusesData } = useJobCardStatuses();
  const jobCardStatuses = statusesData || [];

  const { data, isLoading } = useJobCards({
    search: debouncedSearch,
    status: statusFilter,
    department: departmentFilter,
    page: page + 1,
    limit: rowsPerPage,
    fromDate,
    toDate,
    sortOrder
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedJob(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJob(null);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const columns = [
    {
      header: 'Job Card',
      accessor: 'jobCardNo',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
          {row.jobCardNo}
        </Typography>
      ),
    },
    {
      header: 'Vehicle',
      render: (row) => (
        <VehicleNumberPlate vehicleNumber={row.vehicle?.registrationNo} />
      ),
    },
    { header: 'Owner', render: (row) => row.customer?.fullName || 'N/A' },
    { header: 'Mobile Number', render: (row) => row.customer?.mobileNo || '-' },

    { header: 'Status', render: (row) => <StatusBadge status={row.currentStatus?.statusCode || 'PENDING'} /> },
    {
      header: 'MECHANIC',
      accessor: 'technician',
      render: (row) => {
        const mechanicStr = row.technician || 'Unassigned';
        const mechanics = mechanicStr.split(',').map(name => name.trim()).filter(Boolean);
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {mechanics.map((mechanicName, idx) => (
              <Chip
                key={idx}
                label={mechanicName}
                size="small"
                sx={{
                  bgcolor: mechanicName === 'Unassigned' ? 'transparent' : '#eff6ff',
                  color: mechanicName === 'Unassigned' ? '#d97706' : '#2563eb',
                  border: `1px solid ${mechanicName === 'Unassigned' ? '#fcd34d' : '#bfdbfe'}`,
                  fontWeight: 600,
                  borderRadius: '9999px'
                }}
              />
            ))}
          </Box>
        );
      }
    },
    {
      header: 'BAY',
      accessor: 'bay',
      render: (row) => {
        const bay = row.bay || row.assignedBay;
        const bayName = bay?.bayName || bay?.bayCode || 'Unassigned';

        return (
          <Chip
            label={bayName}
            size="small"
            sx={{
              bgcolor: bay ? '#ecfdf5' : 'transparent',
              color: bay ? '#047857' : '#64748b',
              border: `1px solid ${bay ? '#a7f3d0' : '#cbd5e1'}`,
              fontWeight: 600,
              borderRadius: '9999px'
            }}
          />
        );
      }
    },
    { header: 'Est. Cost', render: (row) => <Typography variant="body2" fontWeight={600}>{formatCurrency(row.totalEstimate)}</Typography> },
    {
      header: (
        <Box
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', userSelect: 'none' }}
          onClick={() => { setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc'); setPage(0); }}
        >
          Created
          {sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
        </Box>
      ),
      render: (row) => <Typography variant="body2">{formatDateTime(row.createdAt)}</Typography>
    },
    ...(canReadJobCards || canUpdateJobCards || canCreateFloorAdditionalWork || canCreateBodyShopAdditionalWork ? [{
      header: 'Actions',
      render: (row) => (
        <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
          <MoreVertical size={18} />
        </IconButton>
      ),
    }] : []),
  ];

  const tableData = data?.data || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Job Cards"
        breadcrumbs={[{ label: 'Job Cards' }]}
      // actions={canCreateJobCard ? (
      //   <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.CRM_CREATE_JOB_CARD)}>
      //     Create Job Card
      //   </Button>
      // ) : null}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search vehicle, owner, job ID..."
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
          />
        </Box>
        <Select
          size="small"
          displayEmpty
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 250,
              },
            },
          }}
          sx={{
            width: { xs: '100%', sm: 200 },
            bgcolor: 'background.paper',
            borderRadius: '24px',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '1px' },
          }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {jobCardStatuses.map((status) => (
            <MenuItem key={status.statusCode || status.id} value={status.statusCode}>
              {status.statusName}
            </MenuItem>
          ))}
        </Select>
        <DateFilter
          fromDate={fromDate}
          toDate={toDate}
          onChange={(type, val) => {
            if (type === 'from') setFromDate(val);
            if (type === 'to') setToDate(val);
            if (type === 'clear') { setFromDate(''); setToDate(''); }
            setPage(0);
          }}
          onExport={async () => {
            try {
              const params = {
                search: debouncedSearch,
                status: statusFilter,
                department: departmentFilter,
                fromDate,
                toDate
              };

              const res = await exportJobCardsExcelApi(params);
              const { downloadExcelFile } = await import('../../utils/excelExport');
              downloadExcelFile(res, 'Job_Cards.xlsx');
            } catch (err) {
              console.error(err);
            }
          }}
        />
        <ResetFiltersButton onReset={handleResetFilters} />
      </Box>

      <Card sx={{ borderRadius: 0 }}>
        <DataTable
          columns={columns}
          data={tableData}
          loading={isLoading}
          emptyMessage="No job cards found"
          serverSide={true}
          totalCount={data?.meta?.total || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowDoubleClick={(row) => {
            if (canReadJobCards) {
              navigate(`${ROUTES.JOB_CARDS}/view/${row.slug || row.id}`);
            }
          }}
        />
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 220, borderRadius: 2, mt: 0.5 } }}
      >
        {canReadJobCards && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`${ROUTES.JOB_CARDS}/view/${selectedJob?.slug || selectedJob?.id}`); }}>
            <Eye size={16} className="mr-3 text-primary" />
            View
          </MenuItem>
        )}
        {canUpdateJobCards &&
          !['READY_FOR_DELIVERY', 'DELIVERED', 'READY_FOR_DELIVERED', 'VEHICLE_DELIVERED'].includes(
            String(selectedJob?.currentStatus?.statusCode || selectedJob?.currentStatus?.code || '').toUpperCase()
          ) && (
            <MenuItem onClick={() => { handleMenuClose(); navigate(`${ROUTES.JOB_CARDS}/edit/${selectedJob?.slug || selectedJob?.id}`); }}>
              <Edit size={16} className="mr-3 text-warning" />
              Edit
            </MenuItem>
          )}
        {(canCreateFloorAdditionalWork || canCreateBodyShopAdditionalWork) &&
          !['COMPLETED', 'READY_FOR_DELIVERY', 'DELIVERED', 'REJECTED'].includes(selectedJob?.currentStatus?.statusCode) && (
            (() => {
              const isRestricted = ['body-shop', 'water-wash', 'mechanical'].includes(department);
              const targetDepartment = (department === 'body-shop' || (!canCreateFloorAdditionalWork && canCreateBodyShopAdditionalWork)) ? 'body-shop' : 'mechanical';
              
              const jcStatus = String(selectedJob?.currentStatus?.statusCode || '').toUpperCase();

              if (isRestricted) {
                if (targetDepartment === 'mechanical' && (jcStatus.includes('BODY_SHOP') || jcStatus.includes('WATER_WASH'))) return false;
                if (targetDepartment === 'body-shop' && !jcStatus.includes('BODY_SHOP')) return false;
                if (targetDepartment === 'water-wash' && !jcStatus.includes('WATER_WASH')) return false;
              }

              const assignments = selectedJob?.workAssignments || [];

              if (assignments.length > 0) {
                const relevantAssignments = isRestricted 
                  ? assignments.filter(a => {
                      const cat = a.jobCardService?.serviceItem?.category?.slug || a.jobCardService?.serviceItem?.category?.name || a.service?.category?.slug || a.service?.category?.name || '';
                      return String(cat).toLowerCase().replace(/[\s_]+/g, '-') === targetDepartment;
                    })
                  : assignments;

                if (relevantAssignments.length === 0) return false;

                return relevantAssignments.some(a => {
                  const statusCode = String(a.status?.statusCode || a.status?.code || '').toUpperCase();
                  if (statusCode.includes('COMPLETED') || a.completedAt) return false;
                  return statusCode.includes('ASSIGNED') || statusCode.includes('IN_PROGRESS') || !statusCode;
                });
              }

              const isJcActive = jcStatus.includes('ASSIGNED') || jcStatus.includes('IN_PROGRESS');
              return isJcActive && Boolean(selectedJob?.technician && selectedJob.technician !== 'Unassigned' && String(selectedJob.technician).trim() !== '');
            })()
          ) && (
            <MenuItem onClick={() => {
              handleMenuClose();
              const jobCardIdentifier = selectedJob?.slug || selectedJob?.jobCardNo || selectedJob?.id;
              if (department === 'body-shop' || (!canCreateFloorAdditionalWork && canCreateBodyShopAdditionalWork)) {
                navigate(`${ROUTES.BODY_SHOP_ADDITIONAL_WORK_NEW}?jobCardId=${encodeURIComponent(jobCardIdentifier)}`);
              } else {
                navigate(`${ROUTES.FLOOR_ADDITIONAL_WORK_NEW}?jobCardId=${encodeURIComponent(jobCardIdentifier)}`);
              }
            }}>
              <PlusCircle size={16} className="mr-3 text-body-shop" />
              Add Additional Work
            </MenuItem>
          )}
        {/* <MenuItem onClick={() => {
          handleMenuClose();
          const message = `Hello ${selectedJob?.ownerName || 'Customer'}, your vehicle service card #${selectedJob?.id} estimate is ready. Please reply YES to approve work.`;
          window.open(`https://wa.me/91${selectedJob?.ownerMobile || selectedJob?.mobile || ''}?text=${encodeURIComponent(message)}`, '_blank');
        }} sx={{ color: '#10B981' }}>
          <MessageCircle size={16} className="mr-3 text-success" />
          WhatsApp Resend
        </MenuItem> */}
      </Menu>
    </Box>
  );
}
