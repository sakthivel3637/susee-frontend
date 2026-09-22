import React, { useState, useEffect } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography, Select, Avatar } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Edit, Trash2, Mail, MoreVertical, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import ConfirmDeleteDialog from '../../components/common/ConfirmDeleteDialog';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastError } from '../../notifications/toast';
import { getUsersApi, updateUserStatusApi, exportUsersExcelApi } from '../../api/userApi';
import { getRolesApi } from '../../api/roleApi';
import { getLocationsApi } from '../../api/adminLocationApi';
import { formatDateTime, formatDate } from '../../utils/formatters';
import DateFilter from '../../components/common/DateFilter';
import StatusFilter from '../../components/common/StatusFilter';
import ResetFiltersButton from '../../components/common/ResetFiltersButton';
import { usePermissions } from '../../hooks/usePermissions';
import useAuthStore from '../../store/useAuthStore';

export default function UserList() {
  const navigate = useNavigate();
  const { canRead, canCreate, canUpdate } = usePermissions();
  const { role } = useAuthStore();
  const isAdmin = role === 'admin';
  const canCreateUsers = canCreate('/users');
  const canUpdateUsers = canUpdate('/users');
  const canReadLocations = canRead('/locations');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const rolesRes = await getRolesApi({ limit: 100 });
        if (rolesRes?.success) setRoles(rolesRes.data.roles || []);
      } catch (error) {
        console.error('Failed to fetch roles');
      }

      if (canReadLocations) {
        try {
          const locationsRes = await getLocationsApi({ limit: 100 });
          if (locationsRes?.success) setLocations(locationsRes.data.locations || []);
        } catch (error) {
          console.error('Failed to fetch locations');
        }
      }
    };
    fetchDropdowns();
  }, [canReadLocations]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (roleFilter) params.roleId = roleFilter;
        if (locationFilter) params.locationId = locationFilter;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        if (statusFilter === 'INACTIVE') params.isActive = false;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        const res = await getUsersApi(params);
        if (res?.success) {
          setUsers(res.data.users || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, roleFilter, locationFilter, statusFilter, fromDate, toDate]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setRoleFilter('');
    setLocationFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedUser(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleDelete = () => {
    setDeleteItem(selectedUser);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateUserStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`User "${deleteItem.fullName}" deactivated successfully.`);
          setUsers(prev => prev.map(u => u.id === deleteItem.id ? { ...u, isActive: false } : u));
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to deactivate user');
      } finally {
        setDeleteItem(null);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateUserStatusApi(id, { isActive: newStatus });
      if (res?.success) {
        toastSuccess('User status updated successfully!');
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: newStatus } : u));
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const getUserIdentifier = (user) => user?.slug || user?.id;

  const getUserViewPath = (user) => (
    ROUTES.ADMIN_USER_VIEW.replace(':slug', getUserIdentifier(user))
  );

  const getUserEditPath = (user) => (
    ROUTES.ADMIN_USER_EDIT.replace(':slug', getUserIdentifier(user))
  );

  const columns = [
    {
      header: 'Name',
      accessor: 'fullName',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
            {row.fullName ? row.fullName.charAt(0) : 'U'}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>{row.fullName}</Typography>
        </Box>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <Box component="a" href={`mailto:${row.email}`} sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          <Mail size={14} className="mr-2" /> {row.email}
        </Box>
      ),
    },
    { header: 'Mobile', accessor: 'mobile', render: (row) => row.mobile || '-' },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <Typography variant="caption" sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', py: 0.5, px: 1, borderRadius: 1, fontWeight: 600 }}>
          {row.role?.name || '-'}
        </Typography>
      ),
    },
    ...(isAdmin ? [{
      header: 'Location',
      accessor: 'locationName',
      render: (row) => {
        const foundLocation = locations.find(l => l.id === row.locationId);
        const displayName = row.location?.locationName || row.location?.name || row.locationName || foundLocation?.locationName;
        return (
          <Typography variant="body2" color="text.secondary">
            {displayName || '-'}
          </Typography>
        );
      },
    }] : []),
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        canUpdateUsers ? (
          <RHFSwitch
            value={row.isActive !== undefined ? row.isActive : true}
            onChange={(newVal) => handleStatusChange(row.id, newVal)}
          />
        ) : (
          <Typography variant="body2">{row.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</Typography>
        )
      ),
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
      render: (row) => row.lastLogin ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2">{formatDate(row.lastLogin, 'dd MMM yyyy')}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDate(row.lastLogin, 'hh:mm a')}</Typography>
        </Box>
      ) : (
        <Typography variant="body2">-</Typography>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <IconButton size="small" onClick={(e) => handleMenuClick(e, row)}>
          <MoreVertical size={18} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="User Management"
        // breadcrumbs={[{ label: 'Users' }]}
        actions={
          canCreateUsers ? <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => navigate(ROUTES.ADMIN_USER_NEW)}
          >
            Add User
          </Button> : null
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search by name, email, or mobile..."
            value={search}
            onChange={(val) => { setSearch(val); setPage(0); }}
          />
        </Box>
        <StatusFilter
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(0); }}
        />
        <Select
          size="small"
          displayEmpty
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
          sx={{
            width: { xs: '100%', sm: 180 },
            bgcolor: 'background.paper',
            borderRadius: '24px',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '1px' },
          }}
        >
          <MenuItem value="">All Roles</MenuItem>
          {roles.map((role) => (
            <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
          ))}
        </Select>
        {canReadLocations && (
          <Select
            size="small"
            displayEmpty
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(0); }}
            sx={{
              width: { xs: '100%', sm: 180 },
              bgcolor: 'background.paper',
              borderRadius: '24px',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '1px' },
            }}
          >
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>{loc.locationName}</MenuItem>
            ))}
          </Select>
        )}
        <DateFilter
          fromDate={fromDate}
          toDate={toDate}
          onChange={(type, val) => {
            if (type === 'from') setFromDate(val);
            if (type === 'to') setToDate(val);
            setPage(0);
          }}
          isExporting={isExporting}
          onExport={async () => {
            try {
              setIsExporting(true);
              const params = {};
              if (search) params.search = search;
              if (roleFilter) params.roleId = roleFilter;
              if (locationFilter) params.locationId = locationFilter;
              if (statusFilter === 'ACTIVE') params.isActive = true;
              if (statusFilter === 'INACTIVE') params.isActive = false;
              if (fromDate) params.startDate = fromDate;
              if (toDate) params.endDate = toDate;

              const res = await exportUsersExcelApi(params);
              const { downloadExcelFile } = await import('../../utils/excelExport');
              downloadExcelFile(res, 'Users.xlsx');
            } catch (err) {
              console.error(err);
              toastError(err?.response?.data?.message || 'Failed to export users');
            } finally {
              setIsExporting(false);
            }
          }}
        />
        <ResetFiltersButton onReset={handleResetFilters} />
      </Box>

      <Card sx={{ borderRadius: 0 }}>
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyMessage="No users found"
          serverSide={true}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowDoubleClick={(row) => {
            if (getUserIdentifier(row)) {
              navigate(getUserViewPath(row));
            }
          }}
        />
      </Card>

      <ConfirmDeleteDialog
        open={!!deleteItem}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${deleteItem?.fullName}"?`}
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
        <MenuItem onClick={() => {
          if (getUserIdentifier(selectedUser)) {
            navigate(getUserViewPath(selectedUser));
          }
          handleMenuClose();
        }}>
          <Eye size={16} className="mr-3 text-info" style={{ color: '#0284C7' }} />
          View
        </MenuItem>
        {canUpdateUsers && (
          <MenuItem onClick={() => {
            if (getUserIdentifier(selectedUser)) {
              navigate(getUserEditPath(selectedUser));
            }
            handleMenuClose();
          }}>
            <Edit size={16} className="mr-3 text-primary" />
            Edit
          </MenuItem>
        )}
        {/* <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Trash2 size={16} className="mr-3" />
          Deactivate
        </MenuItem> */}
      </Menu>
    </Box>
  );
}
