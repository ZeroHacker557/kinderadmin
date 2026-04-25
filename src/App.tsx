import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ChildrenPage from '@/pages/ChildrenPage';
import GroupsPage from '@/pages/GroupsPage';
import EmployeesPage from '@/pages/EmployeesPage';
import FinancesPage from '@/pages/FinancesPage';
import SettingsPage from '@/pages/SettingsPage';
import AttendancePage from '@/pages/AttendancePage';
import HelpPage from '@/pages/HelpPage';
import ParentsPage from '@/pages/ParentsPage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-text-tertiary">Loading...</div>;
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/403" element={<UnauthorizedPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route 
          path="/employees" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EmployeesPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/parents" element={<ParentsPage />} />
        <Route 
          path="/finances" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <FinancesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AttendancePage />
            </ProtectedRoute>
          } 
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
