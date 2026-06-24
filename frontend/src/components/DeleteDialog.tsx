import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { Student } from '../types/student';
import { avatarColor, getInitials } from '../utils/studentUtils';

interface DeleteDialogProps {
  open: boolean;
  student: Student | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteDialog({ open, student, deleting, onClose, onConfirm }: DeleteDialogProps) {
  const fullName = student ? `${student.firstName} ${student.lastName}` : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'error.light',
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1,
          }}
        >
          <WarningAmberIcon />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Delete Student
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 1 }}>
        {student && (
          <Avatar
            sx={{
              bgcolor: avatarColor(fullName),
              width: 48,
              height: 48,
              mx: 'auto',
              mb: 2,
              fontWeight: 700,
            }}
          >
            {getInitials(student.firstName, student.lastName)}
          </Avatar>
        )}
        <Typography color="text.secondary">
          Are you sure you want to delete <strong>{fullName || 'this student'}</strong>? This action cannot be
          undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'center', gap: 1 }}>
        <Button onClick={onClose} disabled={deleting} color="inherit" variant="outlined" sx={{ minWidth: 100 }}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={deleting} sx={{ minWidth: 100 }}>
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
