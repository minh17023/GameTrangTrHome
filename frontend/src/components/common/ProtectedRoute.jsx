import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#ffe4e1' }}>
        <h2 style={{ color: '#ff6b81' }}>Đang tải...</h2>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
