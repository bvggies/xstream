import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  // Show loading spinner only if we're still checking auth AND user is not set
  // If user is set (from login/register), don't wait for loading
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && (!user.role || user.role !== 'ADMIN')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

