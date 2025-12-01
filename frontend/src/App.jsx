import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Landing Page & Login
import Home from './pages/Home';
import LoginSelection from './pages/LoginSelection';
import CustomerLogin from './pages/auth/CustomerLogin';
import BusinessLogin from './pages/auth/BusinessLogin';
import CEOLogin from './pages/auth/CEOLogin';

// Dashboards
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CEODashboard from './pages/ceo/CEODashboard';

// Error Pages
import NotFound from './pages/NotFound';

/**
 * Global Keyboard Shortcuts Handler
 * Ctrl+Shift+C = Opens hidden CEO Login
 */
const KeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Shift+C -> CEO Login
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        console.log('[SECURITY] CEO Login shortcut triggered');
        navigate('/system/admin');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return null;
};

/**
 * Protected Route Component
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * JN Business System - Main App Component
 * Version: 2.0.0 MVP Professional
 */
function App() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('\n==============================================');
      console.log('  JN BUSINESS SYSTEM - Frontend Started  ');
      console.log('==============================================');
      console.log('Version: 2.0.0 MVP Professional');
      console.log('Environment:', import.meta.env.MODE);
      console.log('Backend API:', import.meta.env.VITE_API_URL || 'http://localhost:5000');
      console.log('==============================================\n');
    }
  }, []);

  return (
    <Router>
      <KeyboardShortcuts />
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginSelection />} />
        <Route path="/login/customer" element={<CustomerLogin />} />
        <Route path="/login/business" element={<BusinessLogin />} />
        
        {/* ==================== HIDDEN CEO LOGIN ==================== */}
        {/* Access via: /system/admin OR Ctrl+Shift+C */}
        <Route path="/system/admin" element={<CEOLogin />} />
        <Route path="/_.admin" element={<CEOLogin />} />
        
        {/* ==================== CUSTOMER ROUTES ==================== */}
        <Route 
          path="/customer/dashboard" 
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* ==================== BUSINESS ROUTES ==================== */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* ==================== CEO ROUTES ==================== */}
        <Route 
          path="/ceo/dashboard" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <CEODashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* ==================== ERROR ROUTES ==================== */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
