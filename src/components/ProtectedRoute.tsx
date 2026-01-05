import { Navigate } from 'react-router-dom';
import { authToken } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = authToken.get();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

