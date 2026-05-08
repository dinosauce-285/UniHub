export type PendingCheckin = {
  id: string;
  qrCode: string;
  checkedInAt: string;
  deviceId: string;
};

export type CheckinResult = {
  ok: boolean;
  alreadyCheckedIn: boolean;
  registrationId: string;
  qrCode: string | null;
  checkedInAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
  };
  workshop: {
    id: string;
    title: string;
    room: string;
    startTime: string;
    endTime: string;
  };
};

export type CheckinSyncResult = {
  synced: number;
  duplicates: number;
  rejected: number;
  results: Array<{
    qrCode: string | null;
    registrationId: string | null;
    status: 'synced' | 'duplicate' | 'rejected';
    message: string;
  }>;
};
