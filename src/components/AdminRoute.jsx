import React from 'react';
import { Navigate } from 'react-router-dom';
// import { auth } from '../utils/api';
import ProtectedRoute from './ProtectedRoute';

const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
};

export default AdminRoute; 