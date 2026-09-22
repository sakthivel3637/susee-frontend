import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createJobCardApi, updateJobCardApi, deleteJobCardApi } from '../api/jobCardApi';
import { approveRequestApi, rejectRequestApi } from '../api/approvalApi';
import { createUserApi, updateUserApi, deleteUserApi } from '../api/userApi';
import { createServiceApi, updateServiceApi, deleteServiceApi, createBrandApi, updateBrandApi, createModelApi, updateModelApi, createPricingApi, updatePricingApi } from '../api/masterApi';
import { customerApi } from '../api/customerApi';
import { updateVehicleApi } from '../api/vehicleApi';
import { toastSuccess, toastError } from '../notifications/toast';

// ─── JOB CARD MUTATIONS ──────────────────────────────────
export const useCreateJobCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJobCardApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-cards'] });
      toastSuccess('Job card created successfully');
    },
    onError: (err) => toastError(err?.message || 'Failed to create job card'),
  });
};

export const useUpdateJobCard = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateJobCardApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-cards'] });
      toastSuccess('Job card updated');
    },
    onError: (err) => toastError(err?.message || 'Failed to update job card'),
  });
};

export const useDeleteJobCard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteJobCardApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-cards'] });
      toastSuccess('Job card deleted');
    },
    onError: (err) => toastError(err?.message || 'Failed to delete job card'),
  });
};

// ─── APPROVAL MUTATIONS ──────────────────────────────────
export const useApproveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => approveRequestApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      toastSuccess('Request approved successfully');
    },
    onError: (err) => toastError(err?.message || 'Failed to approve request'),
  });
};

export const useRejectRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => rejectRequestApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      toastSuccess('Request rejected');
    },
    onError: (err) => toastError(err?.message || 'Failed to reject request'),
  });
};

// ─── USER MUTATIONS ──────────────────────────────────────
export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toastSuccess('User created successfully');
    },
    onError: (err) => toastError(err?.message || 'Failed to create user'),
  });
};

export const useUpdateUser = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateUserApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toastSuccess('User updated successfully');
    },
    onError: (err) => toastError(err?.message || 'Failed to update user'),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toastSuccess('User deleted');
    },
    onError: (err) => toastError(err?.message || 'Failed to delete user'),
  });
};

// ─── CUSTOMER MUTATIONS ──────────────────────────────────
export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => customerApi.updateCustomer(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers', variables.id] });
      toastSuccess('Customer updated successfully');
    },
    onError: (err) => toastError(err?.message || 'Failed to update customer'),
  });
};

export const useUpdateCustomerStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => customerApi.updateCustomerStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toastSuccess('Customer status updated successfully');
    },
    onError: (err) => toastError(err?.message || 'Failed to update status'),
  });
};

// ─── MASTER MUTATIONS ────────────────────────────────────
export const useCreateService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createServiceApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'services'] }); toastSuccess('Service created'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

export const useUpdateService = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateServiceApi(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'services'] }); toastSuccess('Service updated'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

export const useCreateBrand = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBrandApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'brands'] }); toastSuccess('Brand created'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

export const useUpdateBrand = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateBrandApi(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'brands'] }); toastSuccess('Brand updated'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

export const useCreateModel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createModelApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'models'] }); toastSuccess('Model created'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

export const useUpdateModel = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateModelApi(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'models'] }); toastSuccess('Model updated'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

export const useCreatePricing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPricingApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'pricing'] }); toastSuccess('Pricing created'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

export const useUpdatePricing = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updatePricingApi(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['masters', 'pricing'] }); toastSuccess('Pricing updated'); },
    onError: (err) => toastError(err?.message || 'Failed'),
  });
};

// ─── VEHICLE MUTATIONS ───────────────────────────────────
export const useUpdateVehicle = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => updateVehicleApi(id, data),
    onSuccess: (_, variables) => { 
      qc.invalidateQueries({ queryKey: ['vehicles'] }); 
      qc.invalidateQueries({ queryKey: ['vehicles', id] }); 
      toastSuccess('Vehicle updated successfully'); 
    },
    onError: (err) => toastError(err?.message || 'Failed to update vehicle'),
  });
};
