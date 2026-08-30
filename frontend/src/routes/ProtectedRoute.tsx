import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  fallback?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  fallback = '/login',
}: ProtectedRouteProps) {
  const { token, user, _hasHydrated } = useAuthStore();
  const location = useLocation();

  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
