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
import { getServiceCategoriesApi, updateServiceCategoryStatusApi } from '../../api/adminServiceCategoryApi';
import StatusFilter from '../../components/common/StatusFilter';
import { usePermissions } from '../../hooks/usePermissions';

export default function ServiceCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const { canCreate, canUpdate } = usePermissions();
  const canCreateCategories = canCreate('/master-categories');
  const canUpdateCategories = canUpdate('/master-categories');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        else if (statusFilter === 'INACTIVE') params.isActive = false;
        else params.isActive = 'all';

        const res = await getServiceCategoriesApi(params);
        if (res?.success) {
          setCategories(res.data.serviceCategories || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCategory(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleDelete = () => {
    setDeleteItem(selectedCategory);
    handleMenuClose();
  };

  const getEditPath = (category) => {
    const identifier = category?.slug || category?.id;
    return ROUTES.ADMIN_MASTER_CATEGORIES_EDIT.replace(':slug', identifier);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateServiceCategoryStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`Category "${deleteItem.name}" deactivated successfully.`);
          setCategories(prev => prev.map(c => c.id === deleteItem.id ? { ...c, isActive: false } : c));
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to deactivate category');
      } finally {
        setDeleteItem(null);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateServiceCategoryStatusApi(id, { isActive: newStatus });
      if (res?.success) {
        toastSuccess('Category status updated successfully!');
        setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: newStatus } : c));
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
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
        canUpdateCategories ? (
          <RHFSwitch
            value={row.isActive !== undefined ? row.isActive : true}
            onChange={(newVal) => handleStatusChange(row.id, newVal)}
          />
        ) : (
          <Typography variant="body2">{row.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</Typography>
        )
      )
    },
    ...(canUpdateCategories ? [{
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
        title="Service Categories"
        // breadcrumbs={[{ label: 'Categories' }]}
        actions={canCreateCategories ? (
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_MASTER_CATEGORIES_NEW)}>
            Add Category
          </Button>
        ) : null}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search categories..."
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
          data={categories}
          loading={loading}
          emptyMessage="No service categories found"
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
        title="Deactivate Category"
        message={`Are you sure you want to deactivate category "${deleteItem?.name}"?`}
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
        {canUpdateCategories && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(getEditPath(selectedCategory)); }}>
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
