import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../utils/UserContext';
import LoadingScreen from './LoadingScreen';
// import { auth } from '../utils/api';

const isAuthenticated = () => !!localStorage.getItem('token');
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};
const isSuperAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'super_admin';
};
const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
  const location = useLocation();
  const { isLoading } = useUser();
  const authenticated = isAuthenticated();
  const currentUser = getCurrentUser();

  // Show loading spinner while initializing context
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but no specific roles are required
  if (authenticated && allowedRoles.length === 0) {
    return children;
  }

  // If user is authenticated and roles are specified
  if (authenticated && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => hasRole(role));
    
    if (hasRequiredRole) {
      return children;
    } else {
      // User doesn't have required role, redirect to appropriate dashboard
      if (isSuperAdmin()) {
        return <Navigate to="/superdashboard" replace />;
      } else if (isAdmin()) {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/login" replace />;
      }
    }
  }

  // Fallback
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute; 