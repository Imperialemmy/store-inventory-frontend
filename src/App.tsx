import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import AdminRoute from './components/AdminRoute';
import AppShell from './features/layout/AppShell';
import ProductsPage from './pages/product/ProductsPage';
import CustomerList from './pages/customer/view_customers/CustomerList';
import CustomerForm from './pages/customer/CustomerForm';
import CustomerDetail from './pages/customer/customer_details/CustomerDetail';
import CustomerStatement from './pages/customer/customer_details/CustomerStatement';
import SalesList from './pages/sales/view_sales/SalesList';
import PointOfSale from './pages/sales/pos/PointOfSale';
import SaleDetail from './pages/sales/sale_details/SaleDetail';
import Login from './pages/login/login';
import SignupPage from './pages/signup/SignupPage';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          <Route element={<AppShell />}>
            <Route path="/home" element={<Navigate to="/sales" replace />} />

            <Route path="/sales" element={<PointOfSale />} />
            <Route path="/sales/invoices" element={<SalesList />} />
            <Route path="/sales/:saleId" element={<SaleDetail />} />

            <Route path="/products" element={<ProductsPage />} />

            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:customerId" element={<CustomerDetail />} />
            <Route path="/customers/:customerId/statement" element={<CustomerStatement />} />

            <Route element={<AdminRoute />}>
              <Route path="/customers/add" element={<CustomerForm />} />
              <Route path="/customers/:customerId/edit" element={<CustomerForm />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
