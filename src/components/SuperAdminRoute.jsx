import React from 'react';
import { Navigate } from 'react-router-dom';
// import { auth } from '../utils/api';
import ProtectedRoute from './ProtectedRoute';
import LoadingScreen from './LoadingScreen';
import { useUser } from '../utils/UserContext';

const SuperAdminRoute = ({ children }) => {
  const { user, isLoading } = useUser();
  
  console.log('SuperAdminRoute check:', { 
    user, 
    hasUser: !!user, 
    userRole: user?.role, 
    isSuperAdmin: user?.role === 'super_admin',
    isLoading
  });

  // Show loading spinner while initializing context
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'super_admin') {
    console.log('Access denied - redirecting to access denied page');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
          <p className="text-gray-700">You do not have permission to access this page. Only superadmins can access this section.</p>
          <p className="text-sm text-gray-500 mt-2">
            Current user: {user ? `${user.name} (${user.role})` : 'Not logged in'}
          </p>
        </div>
      </div>
    );
  }
  
  console.log('SuperAdminRoute - access granted');
  return children;
};

export default SuperAdminRoute; 