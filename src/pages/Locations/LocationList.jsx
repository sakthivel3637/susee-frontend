import React, { useState, useEffect } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography, Select, Tooltip } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Edit, Trash2, MapPin, MoreVertical, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import ConfirmDeleteDialog from '../../components/common/ConfirmDeleteDialog';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastError } from '../../notifications/toast';
import { getLocationsApi, updateLocationStatusApi } from '../../api/adminLocationApi';
import StatusFilter from '../../components/common/StatusFilter';

export default function LocationList() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;

        const res = await getLocationsApi(params);
        if (res?.success) {
          setLocations(res.data.locations || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to fetch locations');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchLocations();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedLocation(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLocation(null);
  };

  const handleDelete = () => {
    setDeleteItem(selectedLocation);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateLocationStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`Location "${deleteItem.locationName}" deactivated successfully.`);
          setLocations(prev => prev.map(u => u.id === deleteItem.id ? { ...u, isActive: false } : u));
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to deactivate location');
      } finally {
        setDeleteItem(null);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateLocationStatusApi(id, { isActive: newStatus });
      if (res?.success) {
        toastSuccess('Location status updated successfully!');
        setLocations(prev => prev.map(u => u.id === id ? { ...u, isActive: newStatus } : u));
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const getLocationIdentifier = (location) => location?.slug || location?.id;

  const getLocationViewPath = (location) => (
    ROUTES.ADMIN_LOCATIONS_VIEW.replace(':slug', getLocationIdentifier(location))
  );

  const getLocationEditPath = (location) => (
    ROUTES.ADMIN_LOCATIONS_EDIT.replace(':slug', getLocationIdentifier(location))
  );

  const columns = [
    {
      header: 'Service Center',
      accessor: 'serviceCenter',
      render: (row) => row.serviceCenter?.serviceCenterName || '-',
    },
    {
      header: 'Location Name',
      accessor: 'locationName',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapPin size={16} className="text-gray-400" />
          <Typography variant="body2" fontWeight={600}>{row.locationName}</Typography>
        </Box>
      ),
    },
    {
      header: 'State / District',
      accessor: 'state',
      render: (row) => (
        <Typography variant="body2">
          {row.state?.stateName || '-'} <span style={{ color: '#94A3B8' }}>/</span> {row.district?.districtName || '-'}
        </Typography>
      ),
    },
    { header: 'Contact', accessor: 'contactPhone', render: (row) => row.contactPhone || '-' },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <RHFSwitch
          value={row.isActive !== undefined ? row.isActive : true}
          onChange={(newVal) => handleStatusChange(row.id, newVal)}
        />
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              if (getLocationIdentifier(row)) {
                navigate(getLocationEditPath(row));
              }
            }}
          >
            <Edit size={16} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Service Center & Location Master"
        // breadcrumbs={[{ label: 'Locations' }]}
        actions={
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => navigate(ROUTES.ADMIN_LOCATIONS_NEW)}
          >
            Add Service Center & Location
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search locations or service center..."
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
          />
        </Box>
        <StatusFilter
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(0); }}
        />
      </Box>

      <Card sx={{ borderRadius: 0 }}>
        <DataTable
          columns={columns}
          data={locations}
          loading={loading}
          emptyMessage="No locations found"
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowDoubleClick={(row) => {
            if (getLocationIdentifier(row)) {
              navigate(getLocationViewPath(row));
            }
          }}
        />
      </Card>

      <ConfirmDeleteDialog
        open={!!deleteItem}
        title="Deactivate Location"
        message={`Are you sure you want to deactivate "${deleteItem?.locationName}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </Box>
  );
}
