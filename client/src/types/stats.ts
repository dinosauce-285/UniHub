export type OverviewStats = {
  users: {
    total: number;
    students: number;
    organizers: number;
    checkinStaff: number;
  };
  workshops: {
    total: number;
    draft: number;
    open: number;
    cancelled: number;
    completed: number;
  };
  registrations: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  capacity: {
    totalSlots: number;
    remainingSlots: number;
    claimedSlots: number;
  };
};
