export type Role = 'STUDENT' | 'ORGANIZER' | 'CHECKIN_STAFF';

export type AuthUser = {
  id: string;
  studentId: string | null;
  email: string;
  name: string;
  role: Role;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type AuthResponse = LoginResponse;

export type LoginCredentials = {
  email: string;
  password: string;
};
