export type StudentSyncError = {
  row: number;
  reason: string;
};

export type StudentSyncLog = {
  id: string;
  filename: string;
  totalRows: number;
  imported: number;
  errors: number;
  errorDetails: StudentSyncError[] | null;
  runAt: string;
};

export type StudentSyncLogResponse = {
  items: StudentSyncLog[];
  page: number;
  pageSize: number;
  total: number;
};

export type StudentSyncTriggerResponse = {
  queued: boolean;
  jobId?: string;
};
