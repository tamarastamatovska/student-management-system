import axios from 'axios';
import type { Student, StudentFormData, StudentStats } from '../types/student';

const api = axios.create({
  baseURL: '/api/students',
  headers: {
    'Content-Type': 'application/json',
  },
});

function toPayload(data: StudentFormData) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || null,
    dateOfBirth: data.dateOfBirth || null,
    major: data.major || null,
    enrollmentDate: data.enrollmentDate || null,
  };
}

export interface StudentQueryParams {
  search?: string;
  major?: string;
}

export async function getStudents(params?: StudentQueryParams): Promise<Student[]> {
  const response = await api.get<Student[]>('', { params });
  return response.data;
}

export async function getStudentStats(): Promise<StudentStats> {
  const response = await api.get<StudentStats>('/stats');
  return response.data;
}

export async function getStudent(id: number): Promise<Student> {
  const response = await api.get<Student>(`/${id}`);
  return response.data;
}

export async function createStudent(data: StudentFormData): Promise<Student> {
  const response = await api.post<Student>('', toPayload(data));
  return response.data;
}

export async function updateStudent(id: number, data: StudentFormData): Promise<Student> {
  const response = await api.put<Student>(`/${id}`, toPayload(data));
  return response.data;
}

export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`/${id}`);
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; fieldErrors?: Record<string, string> } | undefined;
    if (data?.fieldErrors) {
      return Object.values(data.fieldErrors).join(', ');
    }
    if (data?.error) {
      return data.error;
    }
    return error.message;
  }
  return 'An unexpected error occurred';
}
