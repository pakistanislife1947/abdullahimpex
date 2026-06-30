import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Route-level code splitting: each page ships as its own small chunk and
// loads only when visited. Keeps the very first load (login + dashboard
// shell) light — this matters most on slower mobile connections.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Stock = lazy(() => import('./pages/Stock'));
const StockDetail = lazy(() => import('./pages/StockDetail'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Sales = lazy(() => import('./pages/Sales'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceBuilder = lazy(() => import('./pages/InvoiceBuilder'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Customers = lazy(() => import('./pages/Customers'));
const Ledger = lazy(() => import('./pages/Ledger'));
const Settings = lazy(() => import('./pages/Settings'));

function PageFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />
    </div>
  );
}

function ProtectedShell() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm text-ink-muted">Loading…</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/stock/:id" element={<StockDetail />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<InvoiceBuilder />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
