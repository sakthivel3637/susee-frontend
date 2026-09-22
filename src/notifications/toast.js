import { toast } from 'react-toastify';

const defaultOptions = {
  position: 'top-right',
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const toastSuccess = (message, options = {}) => {
  toast.success(message, { ...defaultOptions, ...options });
};

export const toastError = (message, options = {}) => {
  toast.error(message, { ...defaultOptions, autoClose: 5000, ...options });
};

export const toastWarning = (message, options = {}) => {
  toast.warning(message, { ...defaultOptions, ...options });
};

export const toastInfo = (message, options = {}) => {
  toast.info(message, { ...defaultOptions, ...options });
};

export const toastLoading = (message) => {
  return toast.loading(message, { position: 'top-right' });
};

export const toastDismiss = (id) => {
  toast.dismiss(id);
};

export const toastUpdate = (id, options) => {
  toast.update(id, { ...defaultOptions, ...options });
};
