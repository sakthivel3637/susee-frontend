import React, { useState, useEffect } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Edit, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastError } from '../../notifications/toast';
import StatusFilter from '../../components/common/StatusFilter';
import { adminBayApi } from '../../api/adminBayApi';
import { usePermissions } from '../../hooks/usePermissions';

export default function BayList() {
  const navigate = useNavigate();
  const [bays, setBays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const { canCreate, canUpdate, role } = usePermissions();
  const canCreateBays = canCreate('/md-bays');
  const canUpdateBays = canUpdate('/md-bays');
  const isAdmin = role === 'admin' || role === 'super-admin' || role === 'super_admin';

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBay, setSelectedBay] = useState(null);

  useEffect(() => {
    const fetchBays = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;

        const res = await adminBayApi.getBays(params);
        if (res?.success || Array.isArray(res?.data?.bays) || Array.isArray(res?.data) || Array.isArray(res)) {
          let fetchedBays = res?.data?.bays || res?.data || res || [];
          if (!Array.isArray(fetchedBays)) fetchedBays = [];

          if (search) {
            const lowerSearch = search.toLowerCase();
            fetchedBays = fetchedBays.filter(b => b.bayName?.toLowerCase().includes(lowerSearch));
          }
          if (statusFilter === 'ACTIVE') {
            fetchedBays = fetchedBays.filter(b => b.isActive === true);
          } else if (statusFilter === 'INACTIVE') {
            fetchedBays = fetchedBays.filter(b => b.isActive === false);
          }

          const hasMetaTotal = res?.meta?.total !== undefined;
          setTotalCount(hasMetaTotal ? res.meta.total : fetchedBays.length);

          if (!hasMetaTotal && fetchedBays.length > rowsPerPage) {
            const start = page * rowsPerPage;
            fetchedBays = fetchedBays.slice(start, start + rowsPerPage);
          }

          setBays(fetchedBays);
        }
      } catch (error) {
        toastError(error?.message || 'Failed to fetch bays');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBays();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedBay(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBay(null);
  };

  const getEditPath = (bay) => {
    const identifier = bay?.bayCode || bay?.id;
    return ROUTES.MD_BAYS_EDIT.replace(':slug', identifier);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await adminBayApi.updateBayStatus(id, newStatus);
      if (res?.success !== false) {
        toastSuccess('Bay status updated successfully!');
        setBays(prev => prev.map(b => b.id === id ? { ...b, isActive: newStatus } : b));
      } else {
        toastError(res?.message || 'Failed to update status');
      }
    } catch (error) {
      toastError(error?.response?.data?.message || error?.message || 'Failed to update status');
    }
  };

  const columns = [
    ...(isAdmin ? [{
      header: 'Location',
      accessor: 'locationName',
      render: (row) => <Typography variant="body2">{row.location?.locationName || row.locationName || '-'}</Typography>
    }] : []),
    {
      header: 'Bay Name',
      accessor: 'bayName',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.bayName}</Typography>
    },
    {
      header: 'Bay Type',
      accessor: 'bayType',
      render: (row) => <Typography variant="body2">{row.bayType}</Typography>
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        canUpdateBays ? (
          <RHFSwitch
            value={row.isActive !== undefined ? row.isActive : true}
            onChange={(newVal) => handleStatusChange(row.id, newVal)}
          />
        ) : (
          <Typography variant="body2">{row.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</Typography>
        )
      )
    },
    ...(canUpdateBays ? [{
      header: 'Actions',
      render: (row) => (
        <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
          <MoreVertical size={18} />
        </IconButton>
      )
    }] : [])
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Bay Master"
        actions={canCreateBays ? (
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.MD_BAYS_NEW)}>
            Add Bay
          </Button>
        ) : null}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search bay..."
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
          data={bays}
          loading={loading}
          emptyMessage="No bays found"
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 180, borderRadius: 2, mt: 0.5 } }}
      >
        {canUpdateBays && (
          <MenuItem onClick={() => {
            handleMenuClose();
            navigate(getEditPath(selectedBay), { state: { bay: selectedBay } });
          }}>
            <Edit size={16} className="mr-3 text-primary" />
            Edit
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
