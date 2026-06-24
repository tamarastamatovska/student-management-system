import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createStudent,
  deleteStudent,
  getErrorMessage,
  getStudents,
  getStudentStats,
  updateStudent,
} from '../api/studentApi';
import DeleteDialog from '../components/DeleteDialog';
import StatsCards from '../components/StatsCards';
import StudentDetailDrawer from '../components/StudentDetailDrawer';
import StudentForm from '../components/StudentForm';
import StudentTable from '../components/StudentTable';
import StudentToolbar from '../components/StudentToolbar';
import type { SortDirection, SortField, Student, StudentFormData, StudentStats } from '../types/student';
import { exportStudentsToCsv, sortStudents } from '../utils/studentUtils';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function StudentListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const debouncedSearch = useDebouncedValue(search, 300);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getStudentStats();
      setStats(data);
    } catch {
      // Stats are supplementary; don't block the page
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents({
        search: debouncedSearch || undefined,
        major: majorFilter || undefined,
      });
      setStudents(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, majorFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, majorFilter]);

  const sortedStudents = useMemo(
    () => sortStudents(students, sortField, sortDirection),
    [students, sortField, sortDirection],
  );

  const majorOptions = stats?.majors ?? [];

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleRefresh = async () => {
    await Promise.all([loadStudents(), loadStats()]);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreate = () => {
    setSelectedStudent(null);
    setFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormOpen(true);
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setDetailOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data: StudentFormData) => {
    try {
      if (selectedStudent) {
        await updateStudent(selectedStudent.id, data);
        showSnackbar('Student updated successfully', 'success');
      } else {
        await createStudent(data);
        showSnackbar('Student created successfully', 'success');
      }
      await Promise.all([loadStudents(), loadStats()]);
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    setDeleting(true);
    try {
      await deleteStudent(selectedStudent.id);
      setDeleteOpen(false);
      setSelectedStudent(null);
      showSnackbar('Student deleted successfully', 'success');
      await Promise.all([loadStudents(), loadStats()]);
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your student records, search, filter, and export data.
        </Typography>
      </Box>

      <StatsCards stats={stats} loading={statsLoading} />

      <StudentToolbar
        search={search}
        major={majorFilter}
        majors={majorOptions}
        onSearchChange={setSearch}
        onMajorChange={setMajorFilter}
        onRefresh={handleRefresh}
        onExport={() => exportStudentsToCsv(sortedStudents)}
        onAdd={handleCreate}
        refreshing={loading}
        resultCount={sortedStudents.length}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <StudentTable
          students={sortedStudents}
          sortField={sortField}
          sortDirection={sortDirection}
          page={page}
          rowsPerPage={rowsPerPage}
          onSort={handleSort}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <StudentForm
        open={formOpen}
        student={selectedStudent}
        majorOptions={majorOptions}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <StudentDetailDrawer
        open={detailOpen}
        student={selectedStudent}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
      />

      <DeleteDialog
        open={deleteOpen}
        student={selectedStudent}
        deleting={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
