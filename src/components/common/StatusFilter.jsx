import React from 'react';
import { Select, MenuItem } from '@mui/material';

export default function StatusFilter({ value, onChange, sx = {} }) {
  return (
    <Select
      size="small"
      displayEmpty
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      sx={{
        width: 150,
        bgcolor: 'background.paper',
        borderRadius: '24px',
        fontSize: '0.875rem',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '1px' },
        ...sx,
      }}
    >
      <MenuItem value="">All Status</MenuItem>
      <MenuItem value="ACTIVE">Active</MenuItem>
      <MenuItem value="INACTIVE">Inactive</MenuItem>
    </Select>
  );
}
