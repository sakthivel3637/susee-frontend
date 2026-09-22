import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Trash2, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmDeleteDialog({
  open,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  onConfirm,
  onCancel,
  isLoading = false
}) {
  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onCancel : undefined}
      PaperProps={{
        sx: {
          borderRadius: 1,
          minWidth: { xs: 320, sm: 400 },
          maxWidth: 420,
          boxShadow: '0px 20px 40px rgba(0,0,0,0.1)',
          p: 1
        }
      }}
    >
      <Box sx={{ position: 'absolute', right: 12, top: 12 }}>
        <IconButton
          onClick={!isLoading ? onCancel : undefined}
          disabled={isLoading}
          size="small"
          sx={{
            color: '#94A3B8',
            border: '1px solid #a1a3a5ff',
            borderRadius: 6,
            '&:hover': {
              bgcolor: '#F8FAFC'
            }
          }}
        >
          <X size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 4, pt: 5, pb: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#EF4444',
            mx: 'auto',
            mb: 3
          }}
        >
          <Trash2 size={32} />
        </Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: '#1E293B' }}>
          {title}
        </Typography>
        <Typography sx={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 0, justifyContent: 'center', gap: 2 }}>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          sx={{ flex: 1, py: 1.2 }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          isLoading={isLoading}
          sx={{
            flex: 1,
            py: 1.2,
            bgcolor: '#EF4444',
            color: 'white',
            '&:hover': { bgcolor: '#DC2626' }
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
