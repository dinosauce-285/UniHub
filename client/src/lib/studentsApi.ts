import { api } from './api';
import type {
  Student,
  StudentImportResult,
  StudentListResponse,
} from '../types/students';

export type ListStudentsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function listStudents(params: ListStudentsParams = {}) {
  const response = await api.get<StudentListResponse>('/students', {
    params,
  });

  return response.data;
}

export async function getStudentDetail(studentId: string) {
  const response = await api.get<Student>(`/students/${studentId}`);
  return response.data;
}

export async function importStudentsCsv(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<StudentImportResult>('/students/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    validateStatus: (status) => (status >= 200 && status < 300) || status === 207,
  });

  return response.data;
}
