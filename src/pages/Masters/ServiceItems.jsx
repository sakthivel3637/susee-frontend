import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, IconButton, Menu, MenuItem, Typography, Tooltip } from '@mui/material';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import { Plus, Edit, Trash2, MoreVertical, FileSpreadsheet, Download, Upload, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import ConfirmDeleteDialog from '../../components/common/ConfirmDeleteDialog';
import { formatCurrency } from '../../utils/formatters';
import RHFSwitch from '../../components/form/RHFSwitch';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess, toastError, toastInfo, toastWarning } from '../../notifications/toast';
import { getServiceItemsApi, updateServiceItemStatusApi, importServiceItemsApi, exportServiceItemsTemplateApi } from '../../api/adminServiceItemApi';
import { downloadExcelFile } from '../../utils/excelExport';
import StatusFilter from '../../components/common/StatusFilter';
import { usePermissions } from '../../hooks/usePermissions';

export default function ServiceItems() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const { canCreate, canUpdate } = usePermissions();
  const canCreateItems = canCreate('/master-items');
  const canUpdateItems = canUpdate('/master-items');

  const [anchorEl, setAnchorEl] = useState(null);
  const [excelAnchorEl, setExcelAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        else if (statusFilter === 'INACTIVE') params.isActive = false;
        else params.isActive = 'all';

        const res = await getServiceItemsApi(params);
        if (res?.success) {
          setItems(res.data.serviceItems || []);
          setTotalCount(res.meta?.total || 0);
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to fetch service items');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleExcelMenuOpen = (event) => {
    setExcelAnchorEl(event.currentTarget);
  };

  const handleExcelMenuClose = () => {
    setExcelAnchorEl(null);
  };

  const handleDownloadTemplate = async () => {
    handleExcelMenuClose();
    try {
      const res = await exportServiceItemsTemplateApi();
      downloadExcelFile(res, 'service_items_import_template.xlsx');
      toastSuccess('Sample template downloaded successfully!');
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to download Excel template');
    }
  };

  const handleTriggerUpload = () => {
    handleExcelMenuClose();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      toastInfo(`Importing "${file.name}"...`);
      const res = await importServiceItemsApi(file);
      if (res?.success) {
        const { importedCount, skippedCount, errors } = res.data || {};
        if (skippedCount > 0) {
          toastWarning(`Import Result: ${importedCount || 0} added, ${skippedCount} skipped.`);
          // Show separate toasts for the errors (limit to 3 to prevent screen flooding)
          if (Array.isArray(errors)) {
            errors.slice(0, 3).forEach(err => toastWarning(err));
            if (errors.length > 3) {
              toastWarning(`...and ${errors.length - 3} more errors.`);
            }
          }
        } else {
          toastSuccess(`Imported ${importedCount || 0} service item(s) successfully!`);
        }
        setPage(0);
        const params = { page: 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        else if (statusFilter === 'INACTIVE') params.isActive = false;
        else params.isActive = 'all';

        const listRes = await getServiceItemsApi(params);
        if (listRes?.success) {
          setItems(listRes.data.serviceItems || []);
          setTotalCount(listRes.meta?.total || 0);
        }
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to import service items file');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDelete = () => {
    setDeleteItem(selectedItem);
    handleMenuClose();
  };

  const getEditPath = (item) => {
    const identifier = item?.slug || item?.id;
    return ROUTES.ADMIN_MASTER_ITEMS_EDIT.replace(':slug', identifier);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        const res = await updateServiceItemStatusApi(deleteItem.id, { isActive: false });
        if (res?.success) {
          toastSuccess(`Service Item "${deleteItem.name}" deactivated successfully.`);
          setItems(prev => prev.map(s => s.id === deleteItem.id ? { ...s, isActive: false } : s));
        }
      } catch (error) {
        toastError(error?.response?.data?.message || 'Failed to deactivate service item');
      } finally {
        setDeleteItem(null);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateServiceItemStatusApi(id, { isActive: newStatus });
      if (res?.success) {
        toastSuccess('Service Item status updated successfully!');
        setItems(prev => prev.map(s => s.id === id ? { ...s, isActive: newStatus } : s));
      }
    } catch (error) {
      toastError(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      header: 'Service Item Name',
      accessor: 'name',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
    },
    {
      header: 'Category Group',
      accessor: 'category',
      render: (row) => row.category?.name || '-'
    },
    {
      header: 'Base Price (₹)',
      accessor: 'defaultPrice',
      render: (row) => <Typography variant="body2" fontWeight={600} color="success.main">{formatCurrency(row.defaultPrice || 0)}</Typography>
    },
    {
      header: 'Est. Duration',
      accessor: 'estimatedMinutes',
      render: (row) => <Typography variant="body2">{row.estimatedMinutes ? `${row.estimatedMinutes} mins` : '-'}</Typography>
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        canUpdateItems ? (
          <RHFSwitch
            value={row.isActive !== undefined ? row.isActive : true}
            onChange={(newVal) => handleStatusChange(row.id, newVal)}
          />
        ) : (
          <Typography variant="body2">{row.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</Typography>
        )
      )
    },
    ...(canUpdateItems ? [{
      header: 'Actions',
      render: (row) => (
        <Tooltip title="Edit">
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
    }] : [])
  ];

  return (
    <Box sx={{ p: { xs: 2, md: '19px' } }}>
      <PageHeader
        title="Service Items"
        // breadcrumbs={[{ label: 'Service Items' }]}
        actions={canCreateItems ? (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Button
              variant="primary"
              leftIcon={FileSpreadsheet}
              rightIcon={ChevronDown}
              onClick={handleExcelMenuOpen}
            >
              Excel
            </Button>
            <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_MASTER_ITEMS_NEW)}>
              Add Service Item
            </Button>
          </Box>
        ) : null}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search items..."
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
          data={items}
          loading={loading}
          emptyMessage="No service items found"
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
        title="Deactivate Service Item"
        message={`Are you sure you want to deactivate service item "${deleteItem?.name}"?`}
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
        {canUpdateItems && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(getEditPath(selectedItem)); }}>
            <Edit size={16} className="mr-3 text-primary" />
            Edit
          </MenuItem>
        )}
        {/* <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Trash2 size={16} className="mr-3" />
          Deactivate
        </MenuItem> */}
      </Menu>

      <Menu
        anchorEl={excelAnchorEl}
        open={Boolean(excelAnchorEl)}
        onClose={handleExcelMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 200, borderRadius: 2, mt: 0.5 } }}
      >
        <MenuItem onClick={handleDownloadTemplate}>
          <Download size={22} strokeWidth={2} className="mr-4 text-primary" />
          Download Template
        </MenuItem>
        <MenuItem onClick={handleTriggerUpload}>
          <Upload size={20} strokeWidth={2} className="mr-4 text-success" />
          Upload Excel
        </MenuItem>
      </Menu>
    </Box>
  );
}

