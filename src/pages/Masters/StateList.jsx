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
import { getStatesApi, updateStateStatusApi } from '../../api/adminStateApi';
import StatusFilter from '../../components/common/StatusFilter';

export default function StateList() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;

        const res = await getStatesApi(params);
        if (res?.success) {
          setStates(res.data.states || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.message || 'Failed to fetch states');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchStates();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedState(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedState(null);
  };

  const handleDelete = () => {
    setDeleteItem(selectedState);
    handleMenuClose();
  };

  const getEditPath = (state) => {
    const identifier = state?.slug || state?.id;
    return ROUTES.ADMIN_MASTER_STATES_EDIT.replace(':slug', identifier);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateStateStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`State "${deleteItem.stateName}" deactivated successfully.`);
          setStates(prev => prev.map(s => s.id === deleteItem.id ? { ...s, isActive: false } : s));
        }
      } catch (error) {
        toastError(error?.message || 'Failed to deactivate state');
      } finally {
        setDeleteItem(null);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateStateStatusApi(id, { isActive: newStatus });
      if (res?.success) {
        toastSuccess('State status updated successfully!');
        setStates(prev => prev.map(s => s.id === id ? { ...s, isActive: newStatus } : s));
      }
    } catch (error) {
      toastError(error?.message || 'Failed to update status');
    }
  };

  const filteredStates = states;

  const columns = [
    {
      header: 'State Name',
      accessor: 'stateName',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.stateName}</Typography>
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
        title="State Master"
        // breadcrumbs={[{ label: 'States Master' }]}
        actions={
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_MASTER_STATES_NEW)}>
            Add State
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search state"
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
          data={filteredStates}
          loading={loading}
          emptyMessage="No states found"
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
        title="Deactivate State"
        message={`Are you sure you want to deactivate "${deleteItem?.stateName}"?`}
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
        <MenuItem onClick={() => { handleMenuClose(); navigate(getEditPath(selectedState)); }}>
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
