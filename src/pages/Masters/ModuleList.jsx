import React, { useState, useEffect } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography, Tooltip } from '@mui/material';
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
import { getModulesApi, updateModuleStatusApi } from '../../api/adminModuleApi';
import StatusFilter from '../../components/common/StatusFilter';

export default function ModuleList() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;

        const res = await getModulesApi(params);
        if (res?.success) {
          setModules(res.data.modules || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.message || 'Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchModules();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedModule(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedModule(null);
  };

  const getEditPath = (module) => {
    const identifier = module?.slug || module?.id;
    return ROUTES.ADMIN_MODULES_EDIT.replace(':slug', identifier);
  };

  const handleStatusChange = async (id, newStatus) => {
    const isActive = newStatus === 'ACTIVE' || newStatus === true;
    try {
      const res = await updateModuleStatusApi(id, isActive);
      if (res?.success) {
        toastSuccess('Module status updated successfully!');
        setModules(prev => prev.map(m => m.id === id ? { ...m, isActive: isActive } : m));
      }
    } catch (error) {
      toastError(error?.message || 'Failed to update module status');
    }
  };

  const columns = [
    {
      header: 'Module Name',
      accessor: 'moduleName',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.moduleName}</Typography>
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
        <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
          <MoreVertical size={18} />
        </IconButton>
      )
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Modules Master"
        // breadcrumbs={[{ label: 'Modules' }]}
        actions={
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_MODULES_NEW)}>
            Add Module
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search module..."
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
          data={modules}
          loading={loading}
          emptyMessage="No modules found"
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
        <MenuItem onClick={() => { handleMenuClose(); navigate(getEditPath(selectedModule)); }}>
          <Edit size={16} className="mr-3 text-primary" />
          Edit Module
        </MenuItem>
      </Menu>
    </Box>
  );
}
