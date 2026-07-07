import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import AdminRoute from './components/AdminRoute';
import AppShell from './features/layout/AppShell';
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
import CustomerStatement from './pages/customer/customer_details/CustomerStatement';
import SalesList from './pages/sales/view_sales/SalesList';
import PointOfSale from './pages/sales/pos/PointOfSale';
import SaleDetail from './pages/sales/sale_details/SaleDetail';
import SalesReport from './pages/sales/reports/SalesReport';
import DebtAging from './pages/sales/reports/DebtAging';
import Settings from './pages/settings/Settings';
import EmployeeList from './pages/staff/EmployeeList';
import EmployeeForm from './pages/staff/EmployeeForm';
import AttendancePage from './pages/staff/AttendancePage';
import LeavePage from './pages/staff/LeavePage';
import PayrollPage from './pages/staff/PayrollPage';
import PayrollRunDetail from './pages/staff/PayrollRunDetail';
import ExpenseList from './pages/expense/view_expenses/ExpenseList';
import AddExpense from './pages/expense/add_expenses/AddExpense';
import ExpenseCategoryList from './pages/expense/categories/ExpenseCategoryList';
import AddExpenseCategory from './pages/expense/categories/AddExpenseCategory';
import ExpenseReport from './pages/expense/reports/ExpenseReport';
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
            <Route path="/home" element={<Navigate to="/sales" replace />} />
            <Route path="/settings" element={<Settings />} />
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
            <Route path="/customers/:customerId/statement" element={<CustomerStatement />} />
            <Route path="/sales" element={<PointOfSale />} />
            <Route path="/sales/invoices" element={<SalesList />} />
            <Route path="/sales/reports" element={<SalesReport />} />
            <Route path="/sales/:saleId" element={<SaleDetail />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/expenses/report" element={<ExpenseReport />} />
            <Route path="/expenses/categories" element={<ExpenseCategoryList />} />
            <Route path="/reports/debt-aging" element={<DebtAging />} />
            <Route path="/staff/employees" element={<EmployeeList />} />
            <Route path="/staff/attendance" element={<AttendancePage />} />
            <Route path="/staff/leave" element={<LeavePage />} />
            <Route path="/staff/payroll" element={<PayrollPage />} />
            <Route path="/staff/payroll/:runId" element={<PayrollRunDetail />} />
            <Route element={<AdminRoute />}>
              <Route path="/add-ware" element={<ErrorBoundary><AddWare /></ErrorBoundary>} />
              <Route path="/brands/add" element={<AddBrand />} />
              <Route path="/categories/add" element={<AddCategory />} />
              <Route path="/sizes/add" element={<AddSize />} />
              <Route path="/suppliers/add" element={<AddSupplier />} />
              <Route path="/warehouses/add" element={<AddWarehouse />} />
              <Route path="/customers/add" element={<CustomerForm />} />
              <Route path="/customers/:customerId/edit" element={<CustomerForm />} />
              <Route path="/expenses/add" element={<AddExpense />} />
              <Route path="/expenses/categories/add" element={<AddExpenseCategory />} />
              <Route path="/staff/employees/add" element={<EmployeeForm />} />
              <Route path="/staff/employees/:employeeId/edit" element={<EmployeeForm />} />
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
