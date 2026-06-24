import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import type { Student } from '../types/student';
import { avatarColor, formatDate, getInitials } from '../utils/studentUtils';

interface StudentDetailDrawerProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

export default function StudentDetailDrawer({ open, student, onClose, onEdit }: StudentDetailDrawerProps) {
  if (!student) return null;

  const fullName = `${student.firstName} ${student.lastName}`;
  const color = avatarColor(fullName);

  const details = [
    { icon: <EmailIcon fontSize="small" />, label: 'Email', value: student.email },
    { icon: <PhoneIcon fontSize="small" />, label: 'Phone', value: student.phone || 'Not provided' },
    { icon: <SchoolIcon fontSize="small" />, label: 'Major', value: student.major || 'Undeclared' },
    { label: 'Date of Birth', value: formatDate(student.dateOfBirth) },
    { label: 'Enrollment Date', value: formatDate(student.enrollmentDate) },
    { label: 'Student ID', value: `#${student.id}` },
  ];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 } } } }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: color, width: 56, height: 56, fontSize: 20, fontWeight: 700 }}>
              {getInitials(student.firstName, student.lastName)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {fullName}
              </Typography>
              {student.major && (
                <Chip label={student.major} size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <List disablePadding>
          {details.map(({ icon, label, value }) => (
            <ListItem key={label} disableGutters sx={{ py: 1 }}>
              {icon && <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>}
              {!icon && <Box sx={{ width: 36 }} />}
              <ListItemText
                primary={label}
                secondary={value}
                slotProps={{
                  primary: { variant: 'caption', color: 'text.secondary', sx: { fontWeight: 600 } },
                  secondary: { variant: 'body1', color: 'text.primary' },
                }}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Chip
            label="Edit student"
            color="primary"
            clickable
            onClick={() => {
              onEdit(student);
              onClose();
            }}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>
    </Drawer>
  );
}
