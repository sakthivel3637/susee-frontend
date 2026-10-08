import React, { useState, useEffect } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography, Tooltip } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Edit, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastError } from '../../notifications/toast';
import { getStatusesApi, updateStatusActiveApi } from '../../api/adminStatusMasterApi';
import StatusFilter from '../../components/common/StatusFilter';

export default function StatusList() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;

        const res = await getStatusesApi(params);
        if (res?.success) {
          setStatuses(res.data.statusMasters || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.response?.data?.message || error?.message || 'Failed to fetch statuses');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchStatuses();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedStatus(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStatus(null);
  };

  const getEditPath = (status) => {
    const identifier = status?.slug || status?.id;
    return ROUTES.ADMIN_MASTER_STATUSES_EDIT.replace(':slug', identifier);
  };

  const handleStatusChange = async (id, newStatus) => {
    const isActive = newStatus === 'ACTIVE' || newStatus === true;
    try {
      const res = await updateStatusActiveApi(id, isActive);
      if (res?.success) {
        toastSuccess('Status updated successfully!');
        setStatuses(prev => prev.map(s => s.id === id ? { ...s, isActive: isActive } : s));
      }
    } catch (error) {
      toastError(error?.response?.data?.message || error?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      header: 'Module',
      accessor: 'moduleId',
      render: (row) => <Typography variant="body2">{row.module?.moduleName || 'Unknown Module'}</Typography>
    },
    {
      header: 'Status Name',
      accessor: 'statusName',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.statusName}</Typography>
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <Tooltip title={row.description || ''} arrow placement="bottom">
          <span style={{ maxWidth: 250, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.description || '-'}
          </span>
        </Tooltip>
      )
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
        <Tooltip title="Edit Status">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(getEditPath(row));
            }}
          >
            <Edit size={16} />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Status Master"
        // breadcrumbs={[{ label: 'Statuses' }]}
        actions={
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_MASTER_STATUSES_NEW)}>
            Add Status
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search status or module..."
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
          data={statuses}
          loading={loading}
          emptyMessage="No statuses found"
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
        />
      </Card>
    </Box>
  );
}
