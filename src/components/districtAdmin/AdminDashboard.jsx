import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard({ onLogout }) {
  const [adminEmail, setAdminEmail] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    // Read the stored email directly from localStorage
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setAdminEmail(storedEmail);
    }
  }, []);

  const handleCreateElection = () => {
    navigate('/create-election', { replace: true });
  };

  const handleCreateView = ()=>{
    navigate('/view-election', { replace: true });
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-4">
              Welcome, <span className="font-medium">{adminEmail}</span>
            </span>
            <button
              onClick={onLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Election Management</h2>
              <p className="text-gray-600 mb-6">
                Start a new election process for your district.
              </p>
              <button
                onClick={handleCreateElection}
                className="w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create New Election
              </button>
            </div>
          </div>
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Election Management</h2>
              <p className="text-gray-600 mb-6">
                View the elections that are created
              </p>
              <button
                onClick={handleCreateView}
                className="w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View upcoming Elections
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;