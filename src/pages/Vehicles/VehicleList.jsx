import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, MoreVertical, Eye, Clock } from 'lucide-react';
import { Box, Card, IconButton, Menu, MenuItem, Select, Typography } from '@mui/material';
import { useVehicles } from '../../queries/useDataQueries';
import { exportVehiclesExcelApi } from '../../api/vehicleApi';
import DateFilter from '../../components/common/DateFilter';
import SearchBar from '../../components/common/SearchBar';
import ResetFiltersButton from '../../components/common/ResetFiltersButton';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/common/DataTable';
import VehicleNumberPlate from '../../components/common/VehicleNumberPlate';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';
import { ROUTES } from '../../config/routes';
import { usePermissions } from '../../hooks/usePermissions';

export default function VehicleList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const debouncedSearch = useDebounce(search, 300);
  const { canRead, canUpdate } = usePermissions();
  const canReadVehicles = canRead('/vehicles');
  const canUpdateVehicles = canUpdate('/vehicles');

  const { data, isLoading } = useVehicles({
    search: debouncedSearch,
    fromDate,
    toDate,
    page: page + 1,
    limit: rowsPerPage
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedVehicle(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVehicle(null);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const columns = [
    {
      header: 'Vehicle Number',
      accessor: 'registrationNo',
      render: (row) => (
        <VehicleNumberPlate vehicleNumber={row.registrationNo} />
      ),
    },
    { header: 'Owner Name', render: (row) => row.customer?.fullName || 'N/A' },
    { header: 'Mobile', render: (row) => row.customer?.mobileNo || 'N/A' },
    { header: 'Make & Model', render: (row) => `${row.brand?.name || ''} ${row.model || ''}`.trim() || 'N/A' },

    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive === false ? 'INACTIVE' : 'ACTIVE'} />
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
      render: (row) => <Typography variant="body2">{formatDateTime(row.createdAt)}</Typography>,
    },
    ...(canReadVehicles || canUpdateVehicles ? [{
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
        title="Vehicle Management"
        breadcrumbs={[{ label: 'Vehicles' }]}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search vehicle number, owner, mobile..."
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
          />
        </Box>
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
              const params = {};
              if (search) params.search = search;
              if (fromDate) params.startDate = fromDate;
              if (toDate) params.endDate = toDate;

              const res = await exportVehiclesExcelApi(params);
              const { downloadExcelFile } = await import('../../utils/excelExport');
              downloadExcelFile(res, 'Vehicles.xlsx');
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
          emptyMessage="No vehicles found"
          serverSide={true}
          totalCount={data?.meta?.total || 0}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowDoubleClick={(row) => {
            if (canReadVehicles) {
              navigate(`${ROUTES.VEHICLES}/view/${row.slug || row.id}`);
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
        PaperProps={{ sx: { width: 160, borderRadius: 2, mt: 0.5 } }}
      >
        {canReadVehicles && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`${ROUTES.VEHICLES}/view/${selectedVehicle?.slug || selectedVehicle?.id}`); }}>
            <Eye size={16} className="mr-3 text-primary" />
            View Details
          </MenuItem>
        )}
        {canUpdateVehicles && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`${ROUTES.VEHICLES}/edit/${selectedVehicle?.slug || selectedVehicle?.id}`); }}>
            <Edit3 size={16} className="mr-3 text-warning" />
            Edit Vehicle
          </MenuItem>
        )}
        {canReadVehicles && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`${ROUTES.VEHICLES}/history/${selectedVehicle?.slug || selectedVehicle?.id}`); }}>
            <Clock size={16} className="mr-3 text-warning" />
            History
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
