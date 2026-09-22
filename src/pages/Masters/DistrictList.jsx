import React, { useState, useEffect } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import ConfirmDeleteDialog from '../../components/common/ConfirmDeleteDialog';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastError } from '../../notifications/toast';
import { getDistrictsApi, updateDistrictStatusApi } from '../../api/adminDistrictApi';
import StatusFilter from '../../components/common/StatusFilter';

export default function DistrictList() {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;

        const res = await getDistrictsApi(params);
        if (res?.success) {
          setDistricts(res.data.districts || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.message || 'Failed to fetch districts');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDistricts();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedDistrict(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDistrict(null);
  };

  const handleDelete = () => {
    setDeleteItem(selectedDistrict);
    handleMenuClose();
  };

  const getEditPath = (district) => {
    const identifier = district?.slug || district?.id;
    return ROUTES.ADMIN_MASTER_DISTRICTS_EDIT.replace(':slug', identifier);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateDistrictStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`District "${deleteItem.districtName}" deactivated successfully.`);
          setDistricts(prev => prev.map(d => d.id === deleteItem.id ? { ...d, isActive: false } : d));
        }
      } catch (error) {
        toastError(error?.message || 'Failed to deactivate district');
      } finally {
        setDeleteItem(null);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateDistrictStatusApi(id, { isActive: newStatus });
      if (res?.success) {
        toastSuccess('District status updated successfully!');
        setDistricts(prev => prev.map(d => d.id === id ? { ...d, isActive: newStatus } : d));
      }
    } catch (error) {
      toastError(error?.message || 'Failed to update status');
    }
  };

  const filteredDistricts = districts;

  const columns = [
    {
      header: 'District Name',
      accessor: 'districtName',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.districtName}</Typography>
    },
    {
      header: 'State',
      accessor: 'stateId',
      render: (row) => <Typography variant="body2">{row.state?.stateName || '-'}</Typography>
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
        title="Districts Master"
        // breadcrumbs={[{ label: 'Districts Master' }]}
        actions={
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_MASTER_DISTRICTS_NEW)}>
            Add District
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search district or state..."
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
          data={filteredDistricts}
          loading={loading}
          emptyMessage="No districts found"
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </Card>

      <ConfirmDeleteDialog
        open={!!deleteItem}
        title="Deactivate District"
        message={`Are you sure you want to deactivate "${deleteItem?.districtName}"?`}
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
        <MenuItem onClick={() => { handleMenuClose(); navigate(getEditPath(selectedDistrict)); }}>
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
