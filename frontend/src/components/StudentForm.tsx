import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { Student, StudentFormData } from '../types/student';
import { emptyStudentForm, SUGGESTED_MAJORS } from '../types/student';

interface StudentFormProps {
  open: boolean;
  student: Student | null;
  majorOptions: string[];
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
}

export default function StudentForm({ open, student, majorOptions, onClose, onSubmit }: StudentFormProps) {
  const [form, setForm] = useState<StudentFormData>(emptyStudentForm);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const allMajors = [...new Set([...SUGGESTED_MAJORS, ...majorOptions])].sort();

  useEffect(() => {
    if (student) {
      setForm({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone ?? '',
        dateOfBirth: student.dateOfBirth ?? '',
        major: student.major ?? '',
        enrollmentDate: student.enrollmentDate ?? '',
      });
    } else {
      setForm(emptyStudentForm);
    }
    setErrors({});
  }, [student, open]);

  const handleChange = (field: keyof StudentFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof StudentFormData, string>> = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {student ? <PersonIcon /> : <PersonAddIcon />}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {student ? 'Edit Student' : 'Add New Student'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student ? 'Update student information' : 'Fill in the details below'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First Name"
              value={form.firstName}
              onChange={handleChange('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last Name"
              value={form.lastName}
              onChange={handleChange('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName}
              required
              fullWidth
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phone"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="+1 (555) 000-0000"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              freeSolo
              options={allMajors}
              value={form.major}
              onChange={(_, value) => {
                setForm((prev) => ({ ...prev, major: value ?? '' }));
              }}
              onInputChange={(_, value) => {
                setForm((prev) => ({ ...prev, major: value }));
              }}
              renderInput={(params) => <TextField {...params} label="Major" placeholder="Select or type..." />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Enrollment Date"
              type="date"
              value={form.enrollmentDate}
              onChange={handleChange('enrollmentDate')}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ px: 3 }}>
          {submitting ? 'Saving...' : student ? 'Save Changes' : 'Create Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
