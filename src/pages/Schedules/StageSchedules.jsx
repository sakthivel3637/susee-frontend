import React, { useCallback, useEffect, useState } from 'react';
import { Box, Card, Typography, IconButton, Menu, MenuItem, Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, MoreVertical } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import StatusFilter from '../../components/common/StatusFilter';
import RHFSwitch from '../../components/form/RHFSwitch';
import { ROUTES } from '../../config/routes';
import { toastError, toastSuccess } from '../../notifications/toast';
import {
  getStageTimeLimitsApi,
  updateStageTimeLimitStatusApi
} from '../../api/stageTimeLimitApi';

export default function StageSchedules() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: search.trim() || undefined
      };
      if (statusFilter === 'ACTIVE') params.isActive = true;
      if (statusFilter === 'INACTIVE') params.isActive = false;

      const res = await getStageTimeLimitsApi(params);

      setSchedules(res?.data?.schedules || []);
      setTotalCount(res?.meta?.total || 0);
    } catch (error) {
      toastError(error?.response?.data?.message || error?.message || 'Failed to load stage schedules');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleMenuClick = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSchedule(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSchedule(null);
  };

  const handleEdit = () => {
    if (selectedSchedule) {
      navigate(ROUTES.MD_STAGE_SCHEDULES_EDIT.replace(':id', selectedSchedule.id));
    }
    handleMenuClose();
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStageTimeLimitStatusApi(id, newStatus);
      setSchedules((prev) => prev.map((schedule) => (
        schedule.id === id ? { ...schedule, isActive: newStatus } : schedule
      )));
      toastSuccess('Schedule status updated successfully');
    } catch (error) {
      toastError(error?.response?.data?.message || error?.message || 'Failed to update schedule status');
    }
  };

  const columns = [
    // {
    //   header: 'Location',
    //   accessor: 'locationName',
    //   render: (row) => <Typography variant="body2" fontWeight={600}>{row.locationName || 'All Locations'}</Typography>
    // },
    {
      header: 'Module',
      accessor: 'moduleName'
    },
    {
      header: 'Status / Stage',
      accessor: 'statusName',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.statusName}</Typography>
          <Typography variant="caption" color="text.secondary">{row.stageCode}</Typography>
        </Box>
      )
    },
    {
      header: 'Interval',
      accessor: 'allowedMinutes',
      render: (row) => `${row.allowedMinutes} min`
    },
    {
      header: 'Notify',
      render: (row) => {
        const hasRoles = row.notifyRoles?.length > 0;
        const hasUsers = row.notifyUsers?.length > 0;

        let label = '-';
        let tooltipText = '';

        if (hasRoles) {
          label = `${row.notifyRoles.length} Role(s)`;
          tooltipText = row.notifyRoles.map(r => r.name).join(', ');
        } else if (hasUsers) {
          label = `${row.notifyUsers.length} User(s)`;
          tooltipText = row.notifyUsers.map(u => u.fullName).join(', ');
        }

        return tooltipText ? (
          <Tooltip title={tooltipText} placement="top" arrow>
            <Chip
              size="small"
              variant="outlined"
              label={label}
              sx={{ cursor: 'help' }}
            />
          </Tooltip>
        ) : (
          <Chip size="small" variant="outlined" label={label} />
        );
      }
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => (
        <RHFSwitch
          value={row.isActive}
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
        title="Stage Schedules"
        actions={(
          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => navigate(ROUTES.MD_STAGE_SCHEDULES_NEW)}
          >
            Add Schedule
          </Button>
        )}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 350 } }}>
          <SearchBar
            placeholder="Search schedules..."
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(0);
            }}
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
          data={schedules}
          loading={loading}
          emptyMessage="No schedules found."
          serverSide
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(0);
          }}
        />
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 160, borderRadius: 2, mt: 0.5 } }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit size={16} className="mr-3 text-primary" />
          Edit
        </MenuItem>
      </Menu>
    </Box>
  );
}
