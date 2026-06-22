import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/shared/lib/query-client';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AppLayout } from '@/shared/components/AppLayout';
import { LoginPage } from '@/modules/auth/presentation/pages/LoginPage';
import { DashboardPage } from '@/modules/dashboard/presentation/pages/DashboardPage';
import { BrowsePage } from '@/modules/browse/presentation/pages/BrowsePage';
import { PensumPage } from '@/modules/dashboard/presentation/pages/PensumPage';
import { UsersPage } from '@/modules/users/presentation/pages/UsersPage';
import { PublicPage } from '@/modules/public/presentation/pages/PublicPage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes — no auth required */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/public" element={<PublicPage />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="datos" element={<BrowsePage />} />
            <Route path="pensum" element={<PensumPage />} />
            <Route path="usuarios" element={<UsersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
