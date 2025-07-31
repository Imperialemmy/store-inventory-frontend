// src/pages/AddCategory.tsx
import React, { useState } from 'react';
import api from '../../../services/api';
import { useNavigate } from 'react-router-dom';


const AddCategory: React.FC = () => {
  const [formData, setFormData] = useState({ name: '' });
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    api
      .post('/categories/',{ name: formData.name })
      .then(() => navigate('/categories/add'))
      .catch((error) => console.error('Error adding category:', error.response?.data || error.message));
      setMessage("Category created successfully!");
      setFormData({ name: "" });
      // Optionally clear the message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl text-gray-700 mb-4">Add Category</h2>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg mx-auto shadow-sm">
        {message && <p className="mb-4 text-green-600">{message}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder={"Category name"}
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          Add Category
        </button>
      </form>
    </div>
  );
};

export default AddCategory;