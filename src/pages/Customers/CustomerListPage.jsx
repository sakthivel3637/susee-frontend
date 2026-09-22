import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, Select, Typography, Box, Card } from '@mui/material';
import { Plus, Edit, Trash2, Mail, Search, MoreVertical, MapPin, Eye } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import { toastSuccess } from '../../notifications/toast';
import { ROUTES } from '../../config/routes';
import RHFSwitch from '../../components/form/RHFSwitch';
import StatusFilter from '../../components/common/StatusFilter';

const INITIAL_CUSTOMERS = [
  { id: '1', name: 'Ramesh Patel', email: 'ramesh@gmail.com', mobile: '9876543210', address: '45 Green Park, Madurai', visits: 4, status: 'ACTIVE' },
  { id: '2', name: 'Anjali Sharma', email: 'anjali.s@yahoo.com', mobile: '9123456789', address: '88 KK Nagar, Madurai', visits: 2, status: 'ACTIVE' },
  { id: '3', name: 'Balaji Sundar', email: 'balaji@gmail.com', mobile: '9845601234', address: '12 Bypass Road, Madurai', visits: 7, status: 'ACTIVE' },
  { id: '4', name: 'Srinivasan R', email: 'srini@outlook.com', mobile: '9789012345', address: '303 Anna Nagar, Madurai', visits: 1, status: 'INACTIVE' }
];

import { useCustomers } from '../../queries/useDataQueries';
import { useUpdateCustomerStatus } from '../../mutations/useDataMutations';
import { usePermissions } from '../../hooks/usePermissions';

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const { canRead, canCreate, canUpdate } = usePermissions();
  const canReadCustomers = canRead('/customers');
  const canCreateCustomers = canCreate('/customers');
  const canUpdateCustomers = canUpdate('/customers');

  const { data: customerData, isLoading } = useCustomers({
    page,
    limit,
    search,
    status: statusFilter ? statusFilter.toLowerCase() : undefined
  });
  const statusMutation = useUpdateCustomerStatus();

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await statusMutation.mutateAsync({ id, isActive: newStatus });
    } catch (error) {
      console.error(error);
    }
  };

  const customers = customerData?.data || [];

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'fullName',
      render: (row) => (
        <Link to={`/customers/view/${row.slug || row.id}`} style={{ fontWeight: 600, color: 'var(--color-accent)', textDecoration: 'none' }}>
          {row.fullName}
        </Link>
      )
    },
    {
      header: 'Email',
      accessor: 'emailId',
      render: (row) => row.emailId ? (
        <a href={`mailto:${row.emailId}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#000', fontSize: '0.85rem' }}>
          {row.emailId}
        </a>
      ) : (
        <span style={{ color: '#000', fontSize: '0.85rem' }}>-</span>
      )
    },
    {
      header: 'Mobile',
      accessor: 'mobileNo',
      render: (row) => (
        <span style={{ color: '#000', fontSize: '0.85rem' }}>
          {row.mobileNo || '-'}
        </span>
      )
    },
    // {
    //   header: 'Address',
    //   accessor: 'address',
    //   render: (row) => (
    //     <span style={{ color: '#000', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
    //       <MapPin size={12} /> {row.address || '-'}
    //     </span>
    //   )
    // },
    {
      header: 'Total Visits',
      accessor: 'visits',
      render: (row) => <Typography variant="caption" sx={{ bgcolor: 'grey.100', color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, py: 0.5 }}>{row.visits || 0} visits</Typography>
    },
    {
      header: 'Status',
      render: (row) => (
        canUpdateCustomers ? (
          <RHFSwitch
            value={row.isActive ? 'ACTIVE' : 'INACTIVE'}
            onChange={(newVal) => handleStatusChange(row.id, newVal === 'ACTIVE')}
          />
        ) : (
          <Typography variant="body2">{row.isActive ? 'ACTIVE' : 'INACTIVE'}</Typography>
        )
      )
    },
    ...(canReadCustomers || canUpdateCustomers ? [{
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
        title="Customer Management"
        breadcrumbs={[{ label: 'Customers' }]}
      // actions={canCreateCustomers ? (
      //   <Button variant="primary" leftIcon={Plus} onClick={() => navigate(ROUTES.CUSTOMERS_NEW || '/customers/new')}>
      //     Add Customer
      //   </Button>
      // ) : null}
      />

      <Box sx={{ display: 'flex', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar placeholder="Search by name, email, or mobile..." value={search} onChange={(val) => { setSearch(val); setPage(1); }} />
        </Box>
        <StatusFilter
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
        />
      </Box>

      <Card sx={{ borderRadius: 0 }}>
        <DataTable
          columns={columns}
          data={customers}
          emptyMessage="No customers found"
          isLoading={isLoading}
          serverSide={true}
          totalCount={customerData?.meta?.total || 0}
          page={page - 1}
          rowsPerPage={limit}
          onPageChange={(newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          onRowDoubleClick={(row) => {
            if (canReadCustomers) {
              navigate(`/customers/view/${row.slug || row.id}`);
            }
          }}
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
        {canReadCustomers && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`/customers/view/${selectedCustomer?.slug || selectedCustomer?.id}`); }}>
            <Eye size={16} style={{ marginRight: 12, color: '#0ea5e9' }} />
            View Customer
          </MenuItem>
        )}
        {canUpdateCustomers && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`/customers/edit/${selectedCustomer?.slug || selectedCustomer?.id}`); }}>
            <Edit size={16} style={{ marginRight: 12, color: '#0d9488' }} />
            Edit Customer
          </MenuItem>
        )}

      </Menu>
    </Box>
  );
}
