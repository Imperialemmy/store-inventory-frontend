import React from 'react';

interface FormProps {
  formData: {
    name: string;
    brand: string;
    category: string;
    sizes: number[];
    description: string;
  };
  brands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  sizes: { id: number; size: string; size_unit: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (e: React.ChangeEvent<any>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const WareForm: React.FC<FormProps> = ({ formData, brands, categories, sizes, onChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg mx-auto shadow-sm">
      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Name:</label>
        <input type="text" name="name" value={formData.name} onChange={onChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Product name" />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Brand:</label>
        <select name="brand" value={formData.brand} onChange={onChange} className="w-full p-2 border border-gray-300 rounded">
          <option value="">Select Brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Category:</label>
        <select name="category" value={formData.category} onChange={onChange} className="w-full p-2 border border-gray-300 rounded">
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Sizes:</label>
        <select name="sizes" multiple value={formData.sizes.map(String)} onChange={onChange} className="w-full p-2 border border-gray-300 rounded h-32">
          {sizes.map((size) => (
            <option key={size.id} value={size.id}>{size.size} {size.size_unit}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">Description:</label>
        <textarea name="description" value={formData.description} onChange={onChange} className="w-full p-2 border border-gray-300 rounded" placeholder="About Product" />
      </div>

      <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">Add Product</button>
    </form>
  );
};

export default WareForm;
