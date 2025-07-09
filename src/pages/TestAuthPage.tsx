import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestAuthPage: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleTestLogin = () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjEyY2FydGFAZ21haWwuY29tIiwic3ViIjoiMjJlMWRlMTEtNGMwNC00MWQzLWFmYTItNGQ5NzAzYWYwYTRmIiwiaWF0IjoxNzUyMDI2NDE1LCJleHAiOjE3NTI2MzEyMTV9.RbirpPnFZ-XlDUbKjFze-dIeFjV3U5NpmkauEFiDCjw';
    login(testToken);
  };

  return (
    <div className="min-h-screen bg-background-light p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-header text-primary mb-6">Authentication Test</h1>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Status:</p>
          <p className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
            {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
          </p>
        </div>

        {user && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">User Info:</p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><strong>Email:</strong> {user.email}</p>
              <p className="text-sm"><strong>Name:</strong> {user.name}</p>
              <p className="text-sm"><strong>ID:</strong> {user.id}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={handleTestLogin}
            className="w-full btn-primary"
          >
            Test Login with Token
          </button>
          
          {isAuthenticated && (
            <button
              onClick={logout}
              className="w-full btn-secondary"
            >
              Logout
            </button>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Test URL: <a href="http://localhost:3000/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjEyY2FydGFAZ21haWwuY29tIiwic3ViIjoiMjJlMWRlMTEtNGMwNC00MWQzLWFmYTItNGQ5NzAzYWYwYTRmIiwiaWF0IjoxNzUyMDI2NDE1LCJleHAiOjE3NTI2MzEyMTV9.RbirpPnFZ-XlDUbKjFze-dIeFjV3U5NpmkauEFiDCjw" className="text-blue-600 hover:underline">Click here to test callback</a></p>
        </div>
      </div>
    </div>
  );
};

export default TestAuthPage;