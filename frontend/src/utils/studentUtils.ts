import type { SortDirection, SortField, Student } from '../types/student';

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function sortStudents(
  students: Student[],
  field: SortField,
  direction: SortDirection,
): Student[] {
  return [...students].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'name':
        cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
        break;
      case 'email':
        cmp = a.email.localeCompare(b.email);
        break;
      case 'major':
        cmp = (a.major ?? '').localeCompare(b.major ?? '');
        break;
      case 'enrollmentDate':
        cmp = (a.enrollmentDate ?? '').localeCompare(b.enrollmentDate ?? '');
        break;
    }
    return direction === 'asc' ? cmp : -cmp;
  });
}

export function exportStudentsToCsv(students: Student[]): void {
  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Major', 'Date of Birth', 'Enrollment Date'];
  const rows = students.map((s) => [
    s.id,
    s.firstName,
    s.lastName,
    s.email,
    s.phone ?? '',
    s.major ?? '',
    s.dateOfBirth ?? '',
    s.enrollmentDate ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function avatarColor(name: string): string {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
