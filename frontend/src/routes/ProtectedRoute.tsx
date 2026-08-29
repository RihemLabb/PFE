import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token, _hasHydrated } = useAuthStore();
  const location = useLocation();

  if (!_hasHydrated) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
