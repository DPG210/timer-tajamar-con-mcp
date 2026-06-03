/**
 * ProtectedRoute — wrapper that redirects unauthenticated users to /login.
 * New component, no original equivalent.
 */

import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../../stores/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
