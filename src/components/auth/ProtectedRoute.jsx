import React from 'react';
import { Navigate } from 'react-router-dom';

// This component checks if a user is authenticated before rendering a page.
// If not, it redirects them to the login page.
const ProtectedRoute = ({ children }) => {
  // Check for the user's email and role in localStorage
  const userEmail = localStorage.getItem('userEmail');
  const userType = localStorage.getItem('userType');

  // The condition for being authenticated
  const isAuthenticated = userEmail && userType === 'district';

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page
    // The 'replace' prop prevents the user from going "back" to the protected page
    return <Navigate to="/district-login" replace />;
  }

  // If authenticated, render the child component (e.g., the AdminDashboard)
  return children;
};

export default ProtectedRoute;