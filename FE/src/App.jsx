import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { HashRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import PackageListPage from './pages/PackageListPage.jsx';
import PackageDetailPage from './pages/PackageDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrderCreatePage from './pages/OrderCreatePage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import MyOrdersPage from './pages/MyOrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import ProviderDashboardPage from './pages/ProviderDashboardPage.jsx';
import ProviderPackagesPage from './pages/ProviderPackagesPage.jsx';
import ProviderCreatePackagePage from './pages/ProviderCreatePackagePage.jsx';
import ProviderOrdersPage from './pages/ProviderOrdersPage.jsx';
import ProviderOrderDetailPage from './pages/ProviderOrderDetailPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminProvidersPage from './pages/AdminProvidersPage.jsx';
import AdminPackagesPage from './pages/AdminPackagesPage.jsx';
import AdminOrdersPage from './pages/AdminOrdersPage.jsx';
import AdminOrderDetailPage from './pages/AdminOrderDetailPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProtectedRoute, { GuestRoute } from './routes/ProtectedRoute.jsx';
import { getAuth, getDashboardPath } from './utils/authStorage.js';
import { ToastProvider } from './components/ToastProvider.jsx';

function DashboardRedirect() {
  const auth = getAuth();
  return <Navigate to={auth?.token ? getDashboardPath(auth.role) : '/login'} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<PackageListPage />} />
          <Route path="/products/:id" element={<PackageDetailPage />} />
          <Route path="/packages" element={<PackageListPage />} />
          <Route path="/packages/:id" element={<PackageDetailPage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/customer" element={<ProtectedRoute roles={['Customer']}><DashboardPage role="Customer" /></ProtectedRoute>} />
          <Route path="/orders/create/:packageId" element={<ProtectedRoute roles={['Customer']}><OrderCreatePage /></ProtectedRoute>} />
          <Route path="/checkout/:packageId" element={<ProtectedRoute roles={['Customer']}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders/my" element={<ProtectedRoute roles={['Customer']}><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute roles={['Customer']}><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={['Customer', 'Provider', 'Admin']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/provider" element={<ProtectedRoute roles={['Provider']}><ProviderDashboardPage /></ProtectedRoute>} />
          <Route path="/provider/packages" element={<ProtectedRoute roles={['Provider']}><ProviderPackagesPage /></ProtectedRoute>} />
          <Route path="/provider/packages/create" element={<ProtectedRoute roles={['Provider']}><ProviderCreatePackagePage /></ProtectedRoute>} />
          <Route path="/provider/orders" element={<ProtectedRoute roles={['Provider']}><ProviderOrdersPage /></ProtectedRoute>} />
          <Route path="/provider/orders/:id" element={<ProtectedRoute roles={['Provider']}><ProviderOrderDetailPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['Admin']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/providers" element={<ProtectedRoute roles={['Admin']}><AdminProvidersPage /></ProtectedRoute>} />
          <Route path="/admin/packages" element={<ProtectedRoute roles={['Admin']}><AdminPackagesPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={['Admin']}><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="/admin/orders/:id" element={<ProtectedRoute roles={['Admin']}><AdminOrderDetailPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['Admin']}><AdminReportsPage /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['Admin']}><AdminAuditLogsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <ScrollToTop />
        <AnimatedRoutes />
      </Router>
    </ToastProvider>
  );
}

export default App;
