import React, { useEffect } from 'react';
// import { auth } from '../utils/api';

const isAuthenticated = () => !!localStorage.getItem('token');
const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
const isSuperAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'super_admin';
};
const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

const AccessDenied = () => {
  useEffect(() => {
    const redirectUser = () => {
      if (isAuthenticated()) {
        if (isSuperAdmin()) {
          window.location.href = '/superdashboard';
        } else if (isAdmin()) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    };

    // Redirect after 3 seconds
    const timer = setTimeout(redirectUser, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="space-y-2 text-sm text-gray-500">
          <p>Redirecting to your dashboard...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied; 