// src/pages/ware/AddWare.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import AddWareForm from './WareForm';

interface Brand { id: number; name: string }
interface Category { id: number; name: string }
interface Size { id: number; size: string; size_unit: string }

const AddWare: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', brand: '', category: '', sizes: [] as number[], description: '' });
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Brand[]>('/brands/'),
      api.get<Category[]>('/categories/'),
      api.get<Size[]>('/sizes/'),
    ])
      .then(([brandsRes, catsRes, sizesRes]) => {
        setBrands(brandsRes.data);
        setCategories(catsRes.data);
        setSizes(sizesRes.data);
      })
      .catch((error) => console.error('Error fetching dropdowns:', error));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'sizes' ? Array.from((e.target as HTMLSelectElement).selectedOptions, option => Number(option.value)) : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      brand: formData.brand ? Number(formData.brand) : null,
      category: formData.category ? Number(formData.category) : null,
      size: formData.sizes,
      description: formData.description,
    };

    api
      .post('/wares/', payload)
      .then(() => navigate('/add-ware'))
      .catch((error) => {
      console.error('Error adding ware:', error.response?.data || error.message);
      });
      setMessage("Product Added successfully!");
      setFormData({ name: '', brand: '', category: '', sizes: [], description: '' }); // Clear the form
      // Optionally clear the message after 3 seconds     
      setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl text-gray-700 mb-4">Add Product</h2>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <AddWareForm
        formData={formData}
        brands={brands}
        categories={categories}
        sizes={sizes}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AddWare;
