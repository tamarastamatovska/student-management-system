export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  major?: string;
  enrollmentDate?: string;
}

export interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  major: string;
  enrollmentDate: string;
}

export interface StudentStats {
  totalStudents: number;
  uniqueMajors: number;
  majors: string[];
}

export type SortField = 'name' | 'email' | 'major' | 'enrollmentDate';
export type SortDirection = 'asc' | 'desc';

export const emptyStudentForm: StudentFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  major: '',
  enrollmentDate: '',
};

export const SUGGESTED_MAJORS = [
  'Computer Science',
  'Business Administration',
  'Engineering',
  'Psychology',
  'Biology',
  'Mathematics',
  'Economics',
  'Nursing',
  'Law',
  'Education',
];
