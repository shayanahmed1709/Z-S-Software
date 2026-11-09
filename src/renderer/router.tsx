import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import type { UserRole } from '../shared/types';
import { AppShell } from './components/AppShell';
import { useAuth } from './context/AuthContext';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { EditOrderPage } from './pages/EditOrderPage';
import { InvoicesPage } from './pages/Invoices';
import { LetterheadPage } from './pages/Letterhead';
import { LoginPage } from './pages/Login';
import { NewInvoicePage } from './pages/NewInvoice';
import { NewOrderPage } from './pages/NewOrderPage';
import { NewQuotationPage } from './pages/NewQuotation';
import { OrdersPage } from './pages/OrdersPage';
import { PackagingStockPage } from './pages/PackagingStock';
import { PrintingStockPage } from './pages/PrintingStock';
import { QuotationsPage } from './pages/Quotations';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { UserManagementPage } from './pages/UserManagement';

function RequireAuth() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RequireRole({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/orders/new" element={<NewOrderPage />} />
            <Route path="/orders/:id/edit" element={<EditOrderPage />} />
            <Route element={<RequireRole roles={['admin', 'employee']} />}>
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrdersPage />} />
              <Route path="/inventory/packaging" element={<PackagingStockPage />} />
              <Route path="/inventory/printing" element={<PrintingStockPage />} />
            </Route>
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/quotations/new" element={<NewQuotationPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/new" element={<NewInvoicePage />} />
            <Route path="/letterhead" element={<LetterheadPage />} />
            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UserManagementPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </HashRouter>
  );
}
