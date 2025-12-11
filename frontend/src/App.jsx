import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

// Critical path - load immediately
import Home from './pages/Home';
import LoginSelection from './pages/LoginSelection';
import CustomerLogin from './pages/auth/CustomerLogin';
import BusinessLogin from './pages/auth/BusinessLogin';
import CEOLogin from './pages/auth/CEOLogin';

// Layouts - needed early
import AppLayout from './layouts/AppLayout';
import DashboardLayout from './layouts/DashboardLayout';
import CustomerLayout from './components/layout/CustomerLayout';

// Lazy loaded pages - less critical
const CustomerRegister = lazy(() => import('./pages/auth/CustomerRegister'));
const Register = lazy(() => import('./pages/auth/Register'));
const EmployeeLogin = lazy(() => import('./pages/auth/EmployeeLogin'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Demo = lazy(() => import('./pages/Demo'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Impressum = lazy(() => import('./pages/legal/Impressum'));
const Datenschutz = lazy(() => import('./pages/legal/Datenschutz'));
const AGB = lazy(() => import('./pages/legal/AGB'));

// Lazy loaded dashboards - heavy components
const StudioDashboard = lazy(() => import('./pages/dashboard/StudioDashboard'));
const CustomerDashboard = lazy(() => import('./pages/dashboard/CustomerDashboard'));
const Bookings = lazy(() => import('./pages/dashboard/Bookings'));
const CustomerBooking = lazy(() => import('./pages/customer/Booking'));
const CustomerSettings = lazy(() => import('./pages/customer/Settings'));
const CustomerProfile = lazy(() => import('./pages/customer/Profile'));
const Services = lazy(() => import('./pages/dashboard/Services'));
const Employees = lazy(() => import('./pages/dashboard/Employees'));
const Customers = lazy(() => import('./pages/company/Customers'));
const WidgetSetup = lazy(() => import('./pages/dashboard/WidgetSetup'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const SuccessMetrics = lazy(() => import('./pages/dashboard/SuccessMetrics'));
const GettingStarted = lazy(() => import('./pages/help/GettingStarted'));
const FAQ = lazy(() => import('./pages/help/FAQ'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const CEODashboard = lazy(() => import('./pages/CEODashboard'));
const CEOSettings = lazy(() => import('./pages/ceo/CEOSettings'));
const CEOAnalytics = lazy(() => import('./pages/ceo/Analytics'));
const CEOEmailCampaigns = lazy(() => import('./pages/ceo/EmailCampaigns'));
const CEOPayments = lazy(() => import('./pages/ceo/Payments'));
const CEOSupportTickets = lazy(() => import('./pages/ceo/SupportTickets'));
const CEOAuditLog = lazy(() => import('./pages/ceo/AuditLog'));
const CEOLifecycleEmails = lazy(() => import('./pages/ceo/LifecycleEmails'));
const CEOFeatureFlags = lazy(() => import('./pages/ceo/FeatureFlags'));
const CEOBackups = lazy(() => import('./pages/ceo/Backups'));
const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard'));

// Onboarding
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard'));

// Public Booking (no auth required)
const PublicBooking = lazy(() => import('./pages/booking/PublicBooking'));
const Salons = lazy(() => import('./pages/public/Salons'));
const SalonsByCity = lazy(() => import('./pages/public/SalonsByCity'));

// Error Pages
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading spinner for lazy components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-black">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
      <p className="text-gray-400 mt-4">Laden...</p>
    </div>
  </div>
);

// Wrapper for lazy components
const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

/**
 * Global Keyboard Shortcuts Handler
 * Ctrl+Shift+C = Opens hidden CEO Login (works on ALL pages now for easier access)
 * Security: Route still requires CEO role to access dashboard
 */
const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Shift+C -> CEO Login (case insensitive)
      // Works on any page for convenience - route is protected anyway
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        // Navigate to hidden CEO login
        navigate('/_.admin');
      }
    };

    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [navigate]);

  return null;
};

/**
 * Protected Route Component
 */
const ProtectedRoute = ({ children, requiredRole, allowedRoles }) => {
  // Check both token keys for compatibility
  const token = localStorage.getItem('jnAuthToken') || localStorage.getItem('token');
  const storedUser = localStorage.getItem('jnUser') || localStorage.getItem('user');
  const user = JSON.parse(storedUser || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check for specific required role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (user.role === 'ceo') {
      return <Navigate to="/ceo/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check for allowed roles array
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (user.role === 'ceo') {
      return <Navigate to="/ceo/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
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
        <ScrollToTop />
      <KeyboardShortcuts />
      <Routes>
        {/* ==================== PUBLIC ROUTES (wrapped in AppLayout) ==================== */}
        <Route path="/" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/demo" element={<AppLayout><LazyPage><Demo /></LazyPage></AppLayout>} />
        <Route path="/pricing" element={<AppLayout><LazyPage><Pricing /></LazyPage></AppLayout>} />
        <Route path="/checkout/:planId" element={<AppLayout><LazyPage><Checkout /></LazyPage></AppLayout>} />
        <Route path="/login" element={<AppLayout><LoginSelection /></AppLayout>} />
        <Route path="/login/customer" element={<AppLayout><CustomerLogin /></AppLayout>} />
        <Route path="/login/business" element={<AppLayout><BusinessLogin /></AppLayout>} />
        <Route path="/login/employee" element={<AppLayout><LazyPage><EmployeeLogin /></LazyPage></AppLayout>} />
        <Route path="/register" element={<AppLayout><LazyPage><Register /></LazyPage></AppLayout>} />
        <Route path="/register/customer" element={<AppLayout><LazyPage><CustomerRegister /></LazyPage></AppLayout>} />
        <Route path="/forgot-password" element={<AppLayout><LazyPage><ForgotPassword /></LazyPage></AppLayout>} />
        <Route path="/reset-password" element={<AppLayout><LazyPage><ResetPassword /></LazyPage></AppLayout>} />
        <Route path="/impressum" element={<AppLayout><LazyPage><Impressum /></LazyPage></AppLayout>} />
        <Route path="/datenschutz" element={<AppLayout><LazyPage><Datenschutz /></LazyPage></AppLayout>} />
        <Route path="/agb" element={<AppLayout><LazyPage><AGB /></LazyPage></AppLayout>} />
        <Route path="/faq" element={<AppLayout><LazyPage><FAQ /></LazyPage></AppLayout>} />
        
        {/* ==================== PUBLIC SALON PAGES (SEO) ==================== */}
        <Route path="/salons" element={<AppLayout><LazyPage><Salons /></LazyPage></AppLayout>} />
        <Route path="/salons/:city" element={<AppLayout><LazyPage><SalonsByCity /></LazyPage></AppLayout>} />
        
        {/* ==================== HIDDEN CEO LOGIN ==================== */}
        {/* SECURITY: Only accessible via Ctrl+Shift+C on home page */}
        {/* Route uses non-obvious path that won't be guessed */}
        <Route path="/_.admin" element={<CEOLogin />} />
        
        {/* ==================== ONBOARDING ==================== */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={['salon_owner', 'admin']}>
              <LazyPage><OnboardingWizard /></LazyPage>
            </ProtectedRoute>
          }
        />
        
        {/* ==================== CUSTOMER ROUTES ==================== */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerLayout>
                <LazyPage><CustomerDashboard /></LazyPage>
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/booking"
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerLayout>
                <LazyPage><CustomerBooking /></LazyPage>
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/settings"
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerLayout>
                <LazyPage><CustomerSettings /></LazyPage>
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CustomerLayout>
                <LazyPage><CustomerProfile /></LazyPage>
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        {/* Alias für /book -> /customer/booking */}
        <Route
          path="/book"
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerLayout>
                <LazyPage><CustomerBooking /></LazyPage>
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        
        {/* ==================== EMPLOYEE ROUTES ==================== */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={['employee', 'salon_owner', 'admin']}>
              <DashboardLayout>
                <LazyPage><EmployeeDashboard /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        {/* ==================== STUDIO DASHBOARD (protected) ==================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><StudioDashboard /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/bookings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><Bookings /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/services"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><Services /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/employees"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><Employees /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/customers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><Customers /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/widget"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><WidgetSetup /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><Settings /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/success-metrics"
          element={
            <ProtectedRoute allowedRoles={['salon_owner', 'admin']}>
              <DashboardLayout>
                <LazyPage><SuccessMetrics /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/help"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LazyPage><GettingStarted /></LazyPage>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        
        {/* ==================== BUSINESS ROUTES ==================== */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <LazyPage><AdminDashboard /></LazyPage>
            </ProtectedRoute>
          } 
        />
        
        {/* ==================== CEO ROUTES ==================== */}
        <Route 
          path="/ceo/dashboard" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEODashboard /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/settings" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOSettings /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/analytics" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOAnalytics /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/email-campaigns" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOEmailCampaigns /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/payments" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOPayments /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/support" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOSupportTickets /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/audit-log" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOAuditLog /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/lifecycle-emails" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOLifecycleEmails /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/feature-flags" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOFeatureFlags /></LazyPage>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ceo/backups" 
          element={
            <ProtectedRoute requiredRole="ceo">
              <LazyPage><CEOBackups /></LazyPage>
            </ProtectedRoute>
          } 
        />
        
        {/* ==================== PUBLIC BOOKING (No Auth) ==================== */}
        <Route 
          path="/s/:slug" 
          element={<LazyPage><PublicBooking /></LazyPage>} 
        />
        <Route 
          path="/booking/public" 
          element={<LazyPage><PublicBooking /></LazyPage>} 
        />
        
        {/* ==================== ERROR ROUTES ==================== */}
        <Route path="/404" element={<LazyPage><NotFound /></LazyPage>} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
