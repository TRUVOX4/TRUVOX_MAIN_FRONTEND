import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all your components
import DistrictAdminForm from './components/districtAdmin/DistrictAdminForm';
import AdminLoginForm from './components/districtAdmin/AdminLoginForm';
import AdminDashboard from './components/districtAdmin/AdminDashboard'; // New dashboard component
import Voter from './components/voter/Voter';
import FaceVerification from './components/voter/FaceVerification';

// Import the gatekeeper component
import ProtectedRoute from './components/auth/ProtectedRoute';
import CreateElectionForm from './components/districtAdmin/CreateElectionForm';
import AllElections from './components/districtAdmin/AllElections';

import Navbar from './components/utils/Navbar';
import CreateMLA from './components/districtAdmin/CreateMLA';
import CreateMP from './components/districtAdmin/CreateMP';
import VoterReg from './components/voter/VoterReg';
function App() {
  // State to track if the admin is logged in
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Check for existing login session when the app loads
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    const userType = localStorage.getItem('userType');
    if (userEmail && userType === 'district') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Function to be called from the login form on success
  const handleLogin = () => {
    setIsAdminLoggedIn(true);
  };

  // Function to be passed to the dashboard for logging out
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userType');
    setIsAdminLoggedIn(false);
  };

  return (
    <div>
      <Navbar isAdminLoggedIn={isAdminLoggedIn} onLogout={handleLogout} />
      <Routes>
        {/* --- Public Routes --- */}
        <Route path='/' element={<Navigate to="/Register" replace />} />
        <Route path='/Register' element={<VoterReg />} />
        <Route path='/Verify' element={<FaceVerification />} />
        <Route path='/district-register' element={<DistrictAdminForm />} />

        {/* --- Login Route --- */}
        <Route 
          path='/district-login' 
          element={
            isAdminLoggedIn ? (
              // If already logged in, redirect to dashboard
              <Navigate to="/district-dashboard" replace />
            ) : (
              // Otherwise, show the login form
              <AdminLoginForm onLoginSuccess={handleLogin} />
            )
          } 
        />

        {/* --- Protected Admin Route --- */}
        <Route 
          path="/district-dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-election" 
          element={
            <ProtectedRoute>
              <CreateElectionForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-mla" 
          element={
            <ProtectedRoute>
              <CreateMLA />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-mp" 
          element={
            <ProtectedRoute>
              <CreateMP />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/view-election" 
          element={
            <ProtectedRoute>
              <AllElections />
            </ProtectedRoute>
          } 
        />
        {/* Optional: Add a catch-all 404 route */}
        {/* <Route path="*" element={<h1>404: Not Found</h1>} /> */}
      </Routes>
    </div>
  );
}

export default App;