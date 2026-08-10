import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import MainRoom from './pages/MainRoom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProtectedRoute from './components/common/ProtectedRoute';
import './assets/css/index.css';
import './assets/css/sparkle.css';

function AppContent() {
  const [isEntered, setIsEntered] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  // Handle global click sparkles
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const newSparkle = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      setSparkles(prev => [...prev, newSparkle].slice(-10)); // Keep max 10
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <>
      {/* Render Sparkles */}
      {sparkles.map(sparkle => (
        <div 
          key={sparkle.id} 
          className="sparkle"
          style={{ left: sparkle.x - 10, top: sparkle.y - 10 }}
        >
          ✨
        </div>
      ))}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {!isEntered ? (
                <SplashScreen onEnter={() => setIsEntered(true)} />
              ) : (
                <MainRoom />
              )}
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
