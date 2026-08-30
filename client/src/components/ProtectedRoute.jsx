import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Guards agency routes. `role` optionally pins access to a specific role.
export default function ProtectedRoute({ children, role = 'admin' }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && user?.role !== role) {
    // A client session can't reach the agency app.
    return <Navigate to="/login" replace />;
  }
  return children;
}
