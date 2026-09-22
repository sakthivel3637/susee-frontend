import React, { useState, useEffect } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Edit, Trash2, MoreVertical, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import ConfirmDeleteDialog from '../../components/common/ConfirmDeleteDialog';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastError } from '../../notifications/toast';
import { getServiceCentersApi, updateServiceCenterStatusApi } from '../../api/adminServiceCenterApi';
import StatusFilter from '../../components/common/StatusFilter';

export default function ServiceCenterList() {
  const navigate = useNavigate();
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const fetchServiceCenters = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;

        const res = await getServiceCentersApi(params);
        if (res?.success) {
          setServiceCenters(res.data.serviceCenters || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to fetch service centers');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchServiceCenters();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCenter(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCenter(null);
  };

  const handleDelete = () => {
    setDeleteItem(selectedCenter);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateServiceCenterStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`Service Center "${deleteItem.serviceCenterName}" deactivated successfully.`);
          setServiceCenters(prev => prev.map(sc => sc.id === deleteItem.id ? { ...sc, isActive: false } : sc));
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to deactivate service center');
      } finally {
        setDeleteItem(null);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateServiceCenterStatusApi(id, { isActive: newStatus });
      if (res?.success) {
        toastSuccess('Service Center status updated successfully!');
        setServiceCenters(prev => prev.map(sc => sc.id === id ? { ...sc, isActive: newStatus } : sc));
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      header: 'Service Center Name',
      accessor: 'serviceCenterName',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.serviceCenterName}</Typography>
    },
    {
      header: 'Contact Number',
      accessor: 'contactPhone',
      render: (row) => row.contactPhone || '-'
    },
    {
      header: 'Email',
      accessor: 'contactEmail',
      render: (row) => row.contactEmail || '-'
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <RHFSwitch
          value={row.isActive !== undefined ? row.isActive : true}
          onChange={(newVal) => handleStatusChange(row.id, newVal)}
        />
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
          <MoreVertical size={18} />
        </IconButton>
      )
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Service Centers Master"
        // breadcrumbs={[{ label: 'Service Centers Master' }]}
        actions={
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_SERVICE_CENTERS_NEW)}>
            Add Service Center
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search service center..."
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
          data={serviceCenters}
          loading={loading}
          emptyMessage="No service centers found"
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowDoubleClick={(row) => {
            if (row.id) {
              navigate(ROUTES.ADMIN_SERVICE_CENTERS_VIEW.replace(':id', row.id));
            }
          }}
        />
      </Card>

      <ConfirmDeleteDialog
        open={!!deleteItem}
        title="Deactivate Service Center"
        message={`Are you sure you want to deactivate "${deleteItem?.serviceCenterName}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 180, borderRadius: 2, mt: 0.5 } }}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate(ROUTES.ADMIN_SERVICE_CENTERS_VIEW.replace(':id', selectedCenter?.id)); }}>
          <Eye size={16} className="mr-3 text-blue-500" />
          View
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate(ROUTES.ADMIN_SERVICE_CENTERS_EDIT.replace(':id', selectedCenter?.id)); }}>
          <Edit size={16} className="mr-3 text-primary" />
          Edit
        </MenuItem>
        {/* <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Trash2 size={16} className="mr-3" />
          Deactivate
        </MenuItem> */}
      </Menu>
    </Box>
  );
}
