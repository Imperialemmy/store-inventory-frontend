import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import AdminRoute from './components/AdminRoute';
import AppShell from './features/layout/AppShell';
import Dashboard from './pages/home/Home';
import AddWare from './pages/ware/add_wares/AddWare';
import AddBrand from './pages/brand/add_brands/AddBrand';
import AddCategory from './pages/category/add_categories/AddCategory';
import AddSize from './pages/size/add_sizes/AddSize';
import BrandList from './pages/brand/view_brands/BrandList';
import BrandsWithWares from './pages/brand/view_brands/BrandsWithWares';
import WareDetail from './pages/ware/ware_details/WareDetails';
import CategoryList from './pages/category/view_categories/CategoryList';
import CategoryWares from './pages/category/view_categories/CategoriesWithWare';
import SizeList from './pages/size/view_sizes/SizeList';
import Wares from './pages/ware/view_wares/Wares';
import WareVariantForm from './pages/WareVariant';
import SupplierList from './pages/supplier/view_suppliers/SupplierList';
import AddSupplier from './pages/supplier/add_suppliers/AddSupplier';
import WarehouseList from './pages/warehouse/view_warehouses/WarehouseList';
import AddWarehouse from './pages/warehouse/add_warehouses/AddWarehouse';
import LowStockPage from './pages/low_stock/LowStockPage';
import CustomerList from './pages/customer/view_customers/CustomerList';
import CustomerForm from './pages/customer/CustomerForm';
import CustomerDetail from './pages/customer/customer_details/CustomerDetail';
import ErrorBoundary from './pages/ErrorBoundary';
import Login from './pages/login/login';
import SignupPage from './pages/signup/SignupPage';
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Navigate to="/login"/>} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedLayout />}>
          <Route element={<AppShell />}>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/brands" element={<BrandList />} />
            <Route path="/brands/:brandId" element={<BrandsWithWares />} />
            <Route path="/wares/:wareId" element={<WareDetail />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/categories/:categoryId" element={<CategoryWares />} />
            <Route path="/sizes" element={<SizeList />} />
            <Route path="/wares" element={<Wares />} />
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/warehouses" element={<WarehouseList />} />
            <Route path="/low-stock" element={<LowStockPage />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:customerId" element={<CustomerDetail />} />
            <Route element={<AdminRoute />}>
              <Route path="/add-ware" element={<ErrorBoundary><AddWare /></ErrorBoundary>} />
              <Route path="/brands/add" element={<AddBrand />} />
              <Route path="/categories/add" element={<AddCategory />} />
              <Route path="/sizes/add" element={<AddSize />} />
              <Route path="/suppliers/add" element={<AddSupplier />} />
              <Route path="/warehouses/add" element={<AddWarehouse />} />
              <Route path="/customers/add" element={<CustomerForm />} />
              <Route path="/customers/:customerId/edit" element={<CustomerForm />} />
              <Route path="/wares/:wareId/variants/new" element={<WareVariantForm />} />
              <Route path="/wares/:wareId/variants/:variantId/edit" element={<WareVariantForm />} />
            </Route>
          </Route>
        </Route>

      </Routes>
    </Router>
  );
};

export default App;
