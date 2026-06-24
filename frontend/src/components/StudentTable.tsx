import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SortDirection, SortField, Student } from '../types/student';
import { avatarColor, formatDate, getInitials } from '../utils/studentUtils';

interface StudentTableProps {
  students: Student[];
  sortField: SortField;
  sortDirection: SortDirection;
  page: number;
  rowsPerPage: number;
  onSort: (field: SortField) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

const columns: { id: SortField | 'phone' | 'dob' | 'actions'; label: string; sortable: boolean; field?: SortField }[] = [
  { id: 'name', label: 'Student', sortable: true, field: 'name' },
  { id: 'email', label: 'Email', sortable: true, field: 'email' },
  { id: 'phone', label: 'Phone', sortable: false },
  { id: 'major', label: 'Major', sortable: true, field: 'major' },
  { id: 'dob', label: 'Date of Birth', sortable: false },
  { id: 'enrollmentDate', label: 'Enrolled', sortable: true, field: 'enrollmentDate' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function StudentTable({
  students,
  sortField,
  sortDirection,
  page,
  rowsPerPage,
  onSort,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onDelete,
}: StudentTableProps) {
  const paginated = students.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.id === 'actions' ? 'right' : 'left'}>
                  {col.sortable && col.field ? (
                    <TableSortLabel
                      active={sortField === col.field}
                      direction={sortField === col.field ? sortDirection : 'asc'}
                      onClick={() => onSort(col.field!)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No students found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or add a new student to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((student) => {
                const fullName = `${student.firstName} ${student.lastName}`;
                const color = avatarColor(fullName);
                return (
                  <TableRow
                    key={student.id}
                    hover
                    sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                    onClick={() => onView(student)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: color, width: 36, height: 36, fontSize: 14, fontWeight: 600 }}>
                          {getInitials(student.firstName, student.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID #{student.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {student.phone || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {student.major ? (
                        <Chip label={student.major} size="small" variant="outlined" color="primary" />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                    <TableCell>{formatDate(student.enrollmentDate)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View details">
                        <IconButton size="small" color="default" onClick={() => onView(student)} aria-label="view">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => onEdit(student)} aria-label="edit">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete(student)} aria-label="delete">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={students.length}
        page={page}
        onPageChange={(_, p) => onPageChange(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          onRowsPerPageChange(parseInt(e.target.value, 10));
          onPageChange(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
}
