import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { StudentWorkspace } from './pages/student/StudentWorkspace';
import { WorkshopDetailPage } from './pages/student/WorkshopDetailPage';
import { PaymentPage } from './pages/student/PaymentPage';
import { StudentsPage } from './pages/organizer/StudentsPage';
import { StudentSyncPage } from './pages/organizer/StudentSyncPage';
import { WorkshopsPage } from './pages/organizer/WorkshopsPage';
import { OrganizerWorkshopFormPage } from './pages/organizer/OrganizerWorkshopFormPage';
import { CheckinPage } from './pages/checkin/CheckinPage';
import { ProtectedRoute, roleHome } from './components/ProtectedRoute';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';

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
        path="/student/workshops/:id"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <WorkspaceLayout role="STUDENT">
              <WorkshopDetailPage />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/payments/:registrationId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <WorkspaceLayout role="STUDENT">
              <PaymentPage />
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
        path="/organizer/workshops/new"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <WorkspaceLayout role="ORGANIZER">
              <OrganizerWorkshopFormPage />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/workshops/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <WorkspaceLayout role="ORGANIZER">
              <OrganizerWorkshopFormPage />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/student-sync"
        element={
          <ProtectedRoute allowedRoles={['ORGANIZER']}>
            <WorkspaceLayout role="ORGANIZER">
              <StudentSyncPage />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkin"
        element={
          <ProtectedRoute allowedRoles={['CHECKIN_STAFF']}>
            <WorkspaceLayout role="CHECKIN_STAFF">
              <CheckinPage />
            </WorkspaceLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
