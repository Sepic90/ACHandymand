import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#7f8c8d'
      }}>
        Indlæser...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
