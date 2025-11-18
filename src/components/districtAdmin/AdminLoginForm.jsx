import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// The 'onLoginSuccess' prop is passed from App.jsx to signal a successful login
function AdminLoginForm({onLoginSuccess}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    const formBody = new URLSearchParams();
    formBody.append('email', email);
    formBody.append('password', password);

    try {
      // NOTE: Assuming your backend doesn't return a token, just a success message
      const response = await fetch('http://localhost:8000/district-admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || 'Login failed. Please check your credentials.');
      }
      
      // Handle successful login
      setStatus('success');
      
      // --- THIS IS THE KEY CHANGE ---
      // Store the user's email and role in localStorage
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userType', 'district');
      onLoginSuccess();
      // Signal to the parent App component that login was successful
      navigate('/district-dashboard');

    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  // The JSX for the form remains exactly the same as before
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6">
          Admin Portal
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">
              Email Address
            </label>
            <div className="mt-1">
              <input
                className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <div className="mt-1">
              <input
                className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-gray-400"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Feedback Messages */}
        {status === 'success' && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded-md text-center">
            <p className="font-bold">Login Successful!</p>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md text-center">
            <p className="font-bold">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLoginForm;