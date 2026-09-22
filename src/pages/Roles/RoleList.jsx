import React from 'react';
import { Edit, Plus, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Box, Menu, MenuItem, IconButton, Typography } from '@mui/material';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/common/DataTable';
import { toastSuccess, toastError } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import ConfirmDeleteDialog from '../../components/common/ConfirmDeleteDialog';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { getRolesApi, updateRoleStatusApi } from '../../api/roleApi';
import StatusFilter from '../../components/common/StatusFilter';
import { usePermissions } from '../../hooks/usePermissions';



export default function RoleList() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedRole, setSelectedRole] = React.useState(null);
  const [deleteItem, setDeleteItem] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState('');
  const { canCreate, canUpdate } = usePermissions();
  const canCreateRoles = canCreate('/roles');
  const canUpdateRoles = canUpdate('/roles');

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      if (statusFilter === 'ACTIVE') params.isActive = true;
      if (statusFilter === 'INACTIVE') params.isActive = false;

      const res = await getRolesApi(params);
      if (res?.success) {
        setRoles(res.data.roles || []);
        setTotalCount(res.meta?.total || 0);
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoles();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, page, rowsPerPage, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRole(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handleStatusChange = async (id, newActive) => {
    try {
      const res = await updateRoleStatusApi(id, { isActive: newActive });
      if (res?.success) {
        toastSuccess(res.message || 'Role status updated successfully!');
        setRoles(prev => prev.map(r => r.id === id ? { ...r, isActive: newActive } : r));
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = () => {
    setDeleteItem(selectedRole);
    handleMenuClose();
  };

  const getEditPath = (role) => {
    const identifier = role?.slug || role?.id;
    return ROUTES.ADMIN_ROLE_PRIVILEGES_EDIT.replace(':slug', identifier);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateRoleStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`Role policy for "${deleteItem.name}" deactivated successfully.`);
          setRoles(prev => prev.map(r => r.id === deleteItem.id ? { ...r, isActive: false } : r));
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to deactivate role');
      } finally {
        setDeleteItem(null);
      }
    }
  };


  const columns = [
    {
      header: 'Designation Name',
      accessor: 'name',
      render: (row) => (
        <Typography variant="body2" fontWeight={600} color="text.primary">{row.name}</Typography>
      )
    },
    // {
    //   header: 'Role Code',
    //   accessor: 'slug',
    //   render: (row) => <Typography variant="body2" fontWeight={500} color="text.primary">{row.slug.replace(/-/g, ' ').toUpperCase()}</Typography>
    // },
    {
      header: 'Status',
      render: (row) => (
        canUpdateRoles ? (
          <RHFSwitch
            value={row.isActive}
            onChange={(newVal) => handleStatusChange(row.id, newVal)}
          />
        ) : (
          <Typography variant="body2">{row.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</Typography>
        )
      )
    },
    ...(canUpdateRoles ? [{
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
        title="Role Management"
        // breadcrumbs={[{ label: 'Roles' }]}
        actions={canCreateRoles ? (
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_ROLE_PRIVILEGES)}>
            Add Role Privileges
          </Button>
        ) : null}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search role designation or code..."
            value={search}
            onChange={(v) => { setSearch(v); setPage(0); }}
          />
        </Box>
        <StatusFilter
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(0); }}
        />
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 0 }}>
        <DataTable
          columns={columns}
          data={roles}
          loading={loading}
          pagination
          serverSide={true}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
          emptyMessage="No role found"
        />
      </Box>

      <ConfirmDeleteDialog
        open={!!deleteItem}
        title="Deactivate Role Policy"
        message={`Are you sure you want to deactivate the privileges policy for role "${deleteItem?.name}"?`}
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
        {canUpdateRoles && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(getEditPath(selectedRole)); }}>
            <Edit size={16} style={{ marginRight: 12, color: '#0d9488' }} />
            Edit
          </MenuItem>
        )}
        {/* <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Trash2 size={16} style={{ marginRight: 12, color: 'inherit' }} />
          Deactivate
        </MenuItem> */}
      </Menu>
    </Box>
  );
}
