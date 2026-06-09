import { Navigate, useLocation } from 'react-router-dom';
import { getAuth, getDashboardPath, hasRole } from '../utils/authStorage.js';

function ProtectedRoute({ roles, children }) {
  const location = useLocation();
  const auth = getAuth();
  const from = `${location.pathname}${location.search}`;

  if (!auth?.token) {
    return <Navigate to="/login" replace state={{ from }} />;
  }

  if (!hasRole(auth.role, roles)) {
    return <Navigate to={getDashboardPath(auth.role)} replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const auth = getAuth();

  if (auth?.token) {
    return <Navigate to={getDashboardPath(auth.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
