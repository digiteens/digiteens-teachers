import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Show a loading spinner or message
  }

  if (!user) {
    return <Navigate to="/LoginPage" />; // Redirect to login if user is not authenticated
  }

  return children; // Render the protected component if the user is authenticated
};

export default ProtectedRoute;