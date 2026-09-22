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
import { adminBrandApi } from '../../api/adminBrandApi';
import { usePermissions } from '../../hooks/usePermissions';

export default function BrandList() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const { canCreate, canUpdate } = usePermissions();
  const canCreateBrands = canCreate('/master-brands');
  const canUpdateBrands = canUpdate('/master-brands');

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const params = { page: page + 1, limit: rowsPerPage };
        if (search) params.search = search;
        if (statusFilter === 'ACTIVE') params.isActive = true;
        else if (statusFilter === 'INACTIVE') params.isActive = false;
        else params.isActive = 'all';

        const res = await adminBrandApi.getBrands(params);
        if (res?.success || Array.isArray(res?.data?.brands) || Array.isArray(res?.data) || Array.isArray(res)) {
          let fetchedBrands = res?.data?.brands || res?.data || res || [];
          if (!Array.isArray(fetchedBrands)) fetchedBrands = [];


          if (search) {
            const lowerSearch = search.toLowerCase();
            fetchedBrands = fetchedBrands.filter(b => b.name?.toLowerCase().includes(lowerSearch));
          }
          if (statusFilter === 'ACTIVE') {
            fetchedBrands = fetchedBrands.filter(b => b.isActive === true);
          } else if (statusFilter === 'INACTIVE') {
            fetchedBrands = fetchedBrands.filter(b => b.isActive === false);
          }

          const hasMetaTotal = res?.meta?.total !== undefined;
          setTotalCount(hasMetaTotal ? res.meta.total : fetchedBrands.length);


          if (!hasMetaTotal && fetchedBrands.length > rowsPerPage) {
            const start = page * rowsPerPage;
            fetchedBrands = fetchedBrands.slice(start, start + rowsPerPage);
          }

          setBrands(fetchedBrands);
        }
      } catch (error) {
        toastError(error?.message || 'Failed to fetch brands');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBrands();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, search, statusFilter]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedBrand(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBrand(null);
  };

  const getEditPath = (brand) => {
    const identifier = brand?.slug || brand?.id;
    return ROUTES.ADMIN_MASTER_BRANDS_EDIT.replace(':slug', identifier);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await adminBrandApi.updateBrandStatus(id, newStatus);

      if (res?.success !== false) {
        toastSuccess('Brand status updated successfully!');
        setBrands(prev => prev.map(b => b.id === id ? { ...b, isActive: newStatus } : b));
      } else {
        toastError(res?.message || 'Failed to update status');
      }
    } catch (error) {
      toastError(error?.response?.data?.message || error?.message || 'Failed to update status');
    }
  };

  const columns = [
    {
      header: 'Brand Name',
      accessor: 'name',
      render: (row) => <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        canUpdateBrands ? (
          <RHFSwitch
            value={row.isActive !== undefined ? row.isActive : true}
            onChange={(newVal) => handleStatusChange(row.id, newVal)}
          />
        ) : (
          <Typography variant="body2">{row.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</Typography>
        )
      )
    },
    ...(canUpdateBrands ? [{
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
        title="Brand Master"
        actions={canCreateBrands ? (
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.ADMIN_MASTER_BRANDS_NEW)}>
            Add Brand
          </Button>
        ) : null}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search brand..."
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
          data={brands}
          loading={loading}
          emptyMessage="No brands found"
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
        {canUpdateBrands && (
          <MenuItem onClick={() => {
            handleMenuClose();
            navigate(getEditPath(selectedBrand), { state: { brand: selectedBrand } });
          }}>
            <Edit size={16} className="mr-3 text-primary" />
            Edit
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
