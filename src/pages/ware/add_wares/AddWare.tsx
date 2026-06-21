// src/pages/ware/AddWare.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import AddWareForm from './WareForm';
import { getResults, type PaginatedResponse } from '../../../utils/api';
import PageHeader from '../../../components/ui/PageHeader';

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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Brand[] | PaginatedResponse<Brand>>('/brands/'),
      api.get<Category[] | PaginatedResponse<Category>>('/categories/'),
      api.get<Size[] | PaginatedResponse<Size>>('/sizes/'),
    ])
      .then(([brandsRes, catsRes, sizesRes]) => {
        setBrands(getResults(brandsRes.data));
        setCategories(getResults(catsRes.data));
        setSizes(getResults(sizesRes.data));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const payload = {
      name: formData.name,
      brand: formData.brand ? Number(formData.brand) : null,
      category: formData.category ? Number(formData.category) : null,
      size: formData.sizes,
      description: formData.description,
    };

    try {
      await api.post('/wares/', payload);
      setMessage("Product Added successfully!");
      setFormData({ name: '', brand: '', category: '', sizes: [], description: '' }); // Clear the form
      navigate('/wares');
    } catch {
      setError('Nothing was saved. Check the product details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <PageHeader eyebrow="Product catalogue" title="New product" description="Create the product record first; stock and price variants can be added from its detail page." />
      {message && <p className="notice notice--success">{message}</p>}
      {error && <p className="notice notice--error" role="alert">{error}</p>}
      <AddWareForm
        formData={formData}
        brands={brands}
        categories={categories}
        sizes={sizes}
        onChange={handleChange}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
};

export default AddWare;
