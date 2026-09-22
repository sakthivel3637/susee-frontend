import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsed) ? format(parsed, fmt) : '—';
  } catch {
    return '—';
  }
};
export const formatDateTime = (date) => {
  return formatDate(date, 'dd MMM yyyy, hh:mm a');
};


export const timeAgo = (date) => {
  if (!date) return '—';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsed) ? formatDistanceToNow(parsed, { addSuffix: true }) : '—';
  } catch {
    return '—';
  }
};


export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};


export const formatVehicleNumber = (num) => {
  if (!num) return '—';
  return num.toUpperCase().replace(/\s+/g, ' ').trim();
};


export const formatPhone = (phone) => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 ? `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}` : phone;
};


export const truncate = (text, maxLength = 40) => {
  if (!text) return '—';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};


export const titleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};


export const snakeToLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};
export const formatWaitTime = (minutes) => {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes === 0) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} hr ${mins} min${mins !== 1 ? 's' : ''}` : `${hrs} hr${hrs !== 1 ? 's' : ''}`;
};
