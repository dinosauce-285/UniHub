export type StudentImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};

export type Student = {
  id: string;
  email: string;
  name: string;
  studentId: string | null;
  role: 'STUDENT';
  createdAt: string;
};

export type StudentListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StudentListResponse = {
  items: Student[];
  meta: StudentListMeta;
};
