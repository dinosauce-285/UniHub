import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentWorkspace } from './pages/student/StudentWorkspace';
import { StudentsPage } from './pages/organizer/StudentsPage';
import { WorkshopsPage } from './pages/organizer/WorkshopsPage';
import { ProtectedRoute, roleHome } from './components/ProtectedRoute';
import { RoleWorkspacePlaceholder, WorkspaceLayout } from './layouts/WorkspaceLayout';

export default function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? roleHome(user.role) : '/login'} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <WorkspaceLayout role="STUDENT">
              <StudentWorkspace />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <WorkspaceLayout role="ORGANIZER">
              <StudentsPage />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/workshops"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <WorkspaceLayout role="ORGANIZER">
              <WorkshopsPage />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkin"
        element={
          <ProtectedRoute allowedRoles={['CHECKIN_STAFF']}>
            <WorkspaceLayout role="CHECKIN_STAFF">
              <RoleWorkspacePlaceholder role="CHECKIN_STAFF" />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
