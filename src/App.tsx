import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';

import NavBar from './features/layout/NavBar';
import Dashboard from './pages/home/Home';
import AddWare from './pages/ware/add_wares/AddWare';
import AddBrand from './pages/brand/add_brands/AddBrand';
import AddCategory from './pages/category/add_categories/AddCategory';
import AddSize from './pages/size/add_sizes/AddSize';
import UpdateStock from './pages/UpdateStock';
import BrandList from './pages/brand/view_brands/BrandList';
import BrandsWithWares from './pages/brand/view_brands/BrandsWithWares';
import WareDetail from './pages/ware/ware_details/WareDetails';
import CategoryList from './pages/category/view_categories/CategoryList';
import CategoryWares from './pages/category/view_categories/CategoriesWithWare';
import SizeList from './pages/size/view_sizes/SizeList';
import Wares from './pages/ware/view_wares/Wares';
import WareVariantForm from './pages/WareVariant';
import ErrorBoundary from './pages/ErrorBoundary';
import Login from './pages/login/login';
import SignupPage from './pages/signup/SignupPage';

import { Outlet } from 'react-router-dom';

const ProtectedRoutesLayout = () => (
  <div className="bg-gray-100 min-h-screen">
    <NavBar />
    
    <div className="mt-6 px-4">
      <h1
        className="text-4xl text-gray-900 text-center mb-6 font-regular"
        style={{ fontFamily: "'Segoe Print', cursive, sans-serif" }}
        >
        AkinFolu Foods
      </h1>
      <Outlet /> {/* Render nested routes here */}
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Navigate to="/login"/>} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedLayout />}>
          <Route element={<ProtectedRoutesLayout />}>
            <Route path="/home" element={<Dashboard />} />
            <Route path="/add-ware" element={<ErrorBoundary><AddWare /></ErrorBoundary>} />
            <Route path="/brands" element={<BrandList />} />
            <Route path="/brands/add" element={<AddBrand />} />
            <Route path="/brands/:brandId" element={<BrandsWithWares />} />
            <Route path="/wares/:wareId" element={<WareDetail />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/categories/add" element={<AddCategory />} />
            <Route path="/categories/:categoryId" element={<CategoryWares />} />
            <Route path="/sizes" element={<SizeList />} />
            <Route path="/sizes/add" element={<AddSize />} />
            <Route path="/wares" element={<Wares />} />
            <Route path="/update-stock" element={<UpdateStock />} />
            <Route path="/wares/:wareId/variants/new" element={<WareVariantForm />} />
            <Route path="/wares/:wareId/variants/:variantId/edit" element={<WareVariantForm />} />
          </Route>
        </Route>

      </Routes>
    </Router>
  );
};

export default App;
