import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { useStore } from './lib/store';
import { LowStockBanner } from './components/LowStockBanner';

// Lazy-loaded Pages (code-split to minimize startup memory overhead)
const HomePage = lazy(() => import('./pages/home.jsx'));
const AuthPage = lazy(() => import('./pages/auth.signin.jsx'));
const RegisterPage = lazy(() => import('./pages/auth.register.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth.forgot-password.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth.reset-password.jsx'));
const KdsPage = lazy(() => import('./pages/kds.jsx'));
const PosLayout = lazy(() => import('./pages/pos.jsx'));
const PosIndexPage = lazy(() => import('./pages/pos.index.jsx'));
const PosOrdersPage = lazy(() => import('./pages/pos.orders.jsx'));
const PosCustomersPage = lazy(() => import('./pages/pos.customers.jsx'));
const PosTablesPage = lazy(() => import('./pages/pos.tables.jsx'));
const AdminLayout = lazy(() => import('./pages/admin.jsx'));
const AdminProductsPage = lazy(() => import('./pages/admin.products.jsx'));
const AdminCategoriesPage = lazy(() => import('./pages/admin.categories.jsx'));
const AdminPaymentMethodsPage = lazy(() => import('./pages/admin.payment-methods.jsx'));
const AdminCouponsPage = lazy(() => import('./pages/admin.coupons.jsx'));
const AdminBookingPage = lazy(() => import('./pages/admin.booking.jsx'));
const AdminUsersPage = lazy(() => import('./pages/admin.users.jsx'));
const AdminReportsPage = lazy(() => import('./pages/admin.reports.jsx'));
const AdminInventoryPage = lazy(() => import('./pages/admin.inventory.jsx'));

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FAF3E0] text-[#6F4E37]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#6F4E37] border-t-transparent" />
        <span className="text-xs font-bold tracking-wider uppercase opacity-75">Loading...</span>
      </div>
    </div>
  );
}

function AdminIndexRedirect() {
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  if (user?.role === "INVENTORY_MANAGER") {
    return <Navigate to="/admin/products" replace />;
  }
  return <Navigate to="/admin/reports" replace />;
}

function App() {
  const bootstrap = useStore((s) => s.bootstrap);
  const authToken = useStore((s) => s.authToken);

  useEffect(() => {
    if (authToken) {
      bootstrap();
    }
  }, [authToken, bootstrap]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/kds" element={<KdsPage />} />

          {/* POS Nested Routes */}
          <Route path="/pos" element={<PosLayout />}>
            <Route index element={<PosIndexPage />} />
            <Route path="orders" element={<PosOrdersPage />} />
            <Route path="customers" element={<PosCustomersPage />} />
            <Route path="tables" element={<PosTablesPage />} />
          </Route>

          {/* Admin Nested Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminIndexRedirect />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="payment-methods" element={<AdminPaymentMethodsPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="booking" element={<AdminBookingPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster richColors position="top-right" />
      <LowStockBanner />
    </BrowserRouter>
  );
}

export default App;
