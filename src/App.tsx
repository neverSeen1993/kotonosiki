import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/auth/RequireAuth';
import LoginPage from './pages/LoginPage';
import CatalogPage from './pages/CatalogPage';
import CatProfilePage from './pages/CatProfilePage';
import AppointmentsPage from './pages/AppointmentsPage';
import TreatmentsPage from './pages/TreatmentsPage';
import PlansPage from './pages/PlansPage';
import NotFoundPage from './pages/NotFoundPage';

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
                <Route path="/plans" element={<PlansPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
