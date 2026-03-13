import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/auth/RequireAuth';
import LoginPage from './pages/LoginPage';
import CatalogPage from './pages/CatalogPage';
import CatProfilePage from './pages/CatProfilePage';
import AppointmentsPage from './pages/AppointmentsPage';
import TreatmentsPage from './pages/TreatmentsPage';
import ScheduledPage from './pages/ScheduledPage';
import LogPage from './pages/LogPage';
import AdoptedPage from './pages/AdoptedPage';
import VisitsPage from './pages/VisitsPage';
import ShiftsPage from './pages/ShiftsPage';
import NanniesPage from './pages/NanniesPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './hooks/useAuth';
import { PagePermissions } from './types';


function RequirePageAccess({ page, children }: { page: keyof PagePermissions; children: React.ReactNode }) {
  const { canViewPage, isAdmin } = useAuth();
  if (isAdmin) return <>{children}</>;
  if (!canViewPage(page)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell>
              <Routes>
                <Route path="/" element={<CatalogPage />} />
                <Route path="/cats/:id" element={<CatProfilePage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/treatments" element={<TreatmentsPage />} />
                <Route path="/scheduled" element={<ScheduledPage />} />
                <Route path="/adopted" element={<AdoptedPage />} />
                <Route path="/visits" element={<VisitsPage />} />
                <Route path="/shifts" element={<ShiftsPage />} />
                <Route path="/nannies" element={<RequirePageAccess page="nannies"><NanniesPage /></RequirePageAccess>} />
                <Route path="/log" element={<RequirePageAccess page="log"><LogPage /></RequirePageAccess>} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
