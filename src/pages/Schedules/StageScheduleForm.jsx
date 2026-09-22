import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import RHFTextField from '../../components/form/RHFTextField';
import RHFSelect from '../../components/form/RHFSelect';
import RHFMultiSelect from '../../components/form/RHFMultiSelect';
import RHFSwitch from '../../components/form/RHFSwitch';
import { ROUTES } from '../../config/routes';
import { toastError, toastSuccess } from '../../notifications/toast';
import {
  createStageTimeLimitApi,
  getStageModulesApi,
  getStageRolesApi,
  getStageStatusesApi,
  getStageTimeLimitApi,
  getStageUsersApi,
  updateStageTimeLimitApi
} from '../../api/stageTimeLimitApi';

const optionalPositiveInt = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().int().positive().nullable()
);

const requiredPositiveInt = (label) => z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number({ required_error: `${label} is required`, invalid_type_error: `${label} is required` })
    .int(`${label} must be a valid number`)
    .positive(`${label} is required`)
);

const baseSchema = z.object({
  moduleId: requiredPositiveInt('Module'),
  statusId: requiredPositiveInt('Status / Stage'),
  stageCode: z.string().trim().min(1, 'Stage Code is required'),
  allowedMinutes: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number({ required_error: 'Alert Interval Time is required', invalid_type_error: 'Alert Interval Time is required' })
      .int('Alert Interval Time must be a valid number')
      .min(1, 'Value must be greater than or equal to 1.')
      .max(2147483647, 'Alert Interval Time cannot exceed 2147483647')
  ),
  isActive: z.boolean()
});

const schema = z.discriminatedUnion('notifyBy', [
  baseSchema.extend({
    notifyBy: z.literal('ROLE'),
    notifyRoleIds: z.array(z.number()).min(1, 'Select at least one notify role'),
    notifyUserIds: z.array(z.number()).default([])
  }),
  baseSchema.extend({
    notifyBy: z.literal('USER'),
    notifyRoleIds: z.array(z.number()).default([]),
    notifyUserIds: z.array(z.number()).min(1, 'Select at least one notify user')
  })
]);

const defaultValues = {
  moduleId: '',
  statusId: '',
  stageCode: '',
  allowedMinutes: '',
  notifyBy: 'ROLE',
  notifyRoleIds: [],
  notifyUserIds: [],
  isActive: true
};

const toOptions = (items, getLabel) => items.map((item) => ({
  value: item.id,
  label: getLabel(item)
}));

export default function StageScheduleForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const previousModuleId = useRef();

  const [modules, setModules] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
    watch
  } = methods;

  const moduleId = watch('moduleId');
  const statusId = watch('statusId');
  const notifyBy = watch('notifyBy');

  const moduleOptions = useMemo(
    () => toOptions(modules, (module) => `${module.moduleName} (${module.moduleCode})`),
    [modules]
  );

  const statusOptions = useMemo(
    () => toOptions(statuses, (status) => `${status.statusName} (${status.statusCode})`),
    [statuses]
  );

  const roleOptions = useMemo(
    () => toOptions(roles, (role) => role.name),
    [roles]
  );

  const userOptions = useMemo(
    () => toOptions(users, (user) => `${user.fullName}${user.role?.name ? ` - ${user.role.name}` : ''}`),
    [users]
  );

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        const [modulesRes, rolesRes, usersRes] = await Promise.all([
          getStageModulesApi(),
          getStageRolesApi(),
          getStageUsersApi()
        ]);

        setModules(modulesRes?.data?.modules || []);
        setRoles(rolesRes?.data?.roles || []);
        setUsers(usersRes?.data?.users || []);

        if (isEdit) {
          const detailRes = await getStageTimeLimitApi(id);
          const schedule = detailRes?.data?.schedule;

          if (!schedule) {
            throw new Error('Stage alert schedule not found');
          }

          const statusesRes = await getStageStatusesApi(schedule.moduleId);
          setStatuses(statusesRes?.data?.statuses || []);
          previousModuleId.current = schedule.moduleId;

          reset({
            moduleId: schedule.moduleId,
            statusId: schedule.statusId,
            stageCode: schedule.stageCode || '',
            allowedMinutes: schedule.allowedMinutes,
            notifyBy: schedule.notifyUserIds?.length > 0 && !schedule.notifyRoleIds?.length ? 'USER' : 'ROLE',
            notifyRoleIds: schedule.notifyRoleIds || [],
            notifyUserIds: schedule.notifyUserIds || [],
            isActive: Boolean(schedule.isActive)
          });
        }
      } catch (error) {
        toastError(error?.response?.data?.message || error?.message || 'Failed to load schedule form data');
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
  }, [id, isEdit, reset]);

  useEffect(() => {
    const selectedModuleId = Number(moduleId);

    if (!selectedModuleId) {
      setStatuses([]);
      setValue('statusId', '');
      setValue('stageCode', '');
      previousModuleId.current = selectedModuleId;
      return;
    }

    const loadStatuses = async () => {
      try {
        const moduleChanged = previousModuleId.current && previousModuleId.current !== selectedModuleId;
        const res = await getStageStatusesApi(selectedModuleId);
        setStatuses(res?.data?.statuses || []);

        if (moduleChanged) {
          setValue('statusId', '');
          setValue('stageCode', '');
        }

        previousModuleId.current = selectedModuleId;
      } catch (error) {
        toastError(error?.response?.data?.message || error?.message || 'Failed to load statuses');
      }
    };

    loadStatuses();
  }, [moduleId, setValue]);

  useEffect(() => {
    const selectedStatus = statuses.find((status) => status.id === Number(statusId));
    setValue('stageCode', selectedStatus ? selectedStatus.statusCode : '');
  }, [statusId, statuses, setValue]);

  useEffect(() => {
    if (notifyBy === 'ROLE') {
      setValue('notifyUserIds', []);
    } else if (notifyBy === 'USER') {
      setValue('notifyRoleIds', []);
    }
  }, [notifyBy, setValue]);

  const onSubmit = async (data) => {
    const payload = {
      moduleId: data.moduleId,
      statusId: data.statusId,
      stageCode: data.stageCode,
      allowedMinutes: data.allowedMinutes,
      notifyRoleIds: data.notifyBy === 'ROLE' ? data.notifyRoleIds : [],
      notifyUserIds: data.notifyBy === 'USER' ? data.notifyUserIds : [],
      isActive: data.isActive
    };

    try {
      if (isEdit) {
        await updateStageTimeLimitApi(id, payload);
        toastSuccess('Stage alert schedule updated successfully');
      } else {
        await createStageTimeLimitApi(payload);
        toastSuccess('Stage alert schedule created successfully');
      }

      navigate(ROUTES.MD_STAGE_SCHEDULES);
    } catch (error) {
      toastError(error?.response?.data?.message || error?.message || 'Failed to save stage alert schedule');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, md: 4 }, borderRadius: 3, m: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          {isEdit ? 'Edit Stage Alert Schedule' : 'Add Stage Alert Schedule'}
        </Typography>

        <Box
          component="button"
          onClick={() => navigate(ROUTES.MD_STAGE_SCHEDULES)}
          className="back-btn"
        >
          <ArrowLeft size={16} /> Back to List
        </Box>
      </Box>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <RHFSelect
                name="moduleId"
                label="Module"
                options={moduleOptions}
                placeholder="Select Module"
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <RHFSelect
                name="statusId"
                label="Status / Stage"
                options={statusOptions}
                placeholder={moduleId ? 'Select Status / Stage' : 'Select module first'}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <RHFTextField
                name="stageCode"
                label="Stage Code"
                placeholder="Auto-filled from selected status"
                required
                readOnly
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <RHFTextField
                name="allowedMinutes"
                label="Alert Interval Time"
                type="number"
                placeholder="e.g. 20"
                required
                inputProps={{ min: 1, step: 1 }}
              />
            </Grid>

            {/* <Grid item xs={12} md={6}>
              <RHFSelect
                name="notifyBy"
                label="Notify By"
                options={[
                  { value: 'ROLE', label: 'Role' },
                  { value: 'USER', label: 'Specific User' }
                ]}
                required
              />
            </Grid> */}

            {/* <Grid item xs={12} md={6}>
              {notifyBy === 'USER' ? (
                <RHFMultiSelect
                  name="notifyUserIds"
                  label="Notify Users"
                  options={userOptions}
                  placeholder="Select Users"
                  required
                  disabled={loading}
                />
              ) : (
                <RHFMultiSelect
                  name="notifyRoleIds"
                  label="Notify Roles"
                  options={roleOptions}
                  placeholder="Select Roles"
                  required
                  disabled={loading}
                />
              )}
            </Grid> */}

            <Grid item xs={12} md={6}>

              <RHFMultiSelect
                name="notifyRoleIds"
                label="Notify Roles"
                options={roleOptions}
                placeholder="Select Roles"
                required
                disabled={loading}
              />

            </Grid>

          </Grid>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate(ROUTES.MD_STAGE_SCHEDULES)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={loading}
            >
              Submit
            </Button>
          </Box>
        </form>
      </FormProvider>
    </Box>
  );
}
