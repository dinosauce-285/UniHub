import { api } from './api';
import type { StudentImportResult } from '../types/students';

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
