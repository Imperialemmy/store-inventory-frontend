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
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

const WareForm: React.FC<FormProps> = ({ formData, brands, categories, sizes, onChange, onSubmit, saving }) => {
  return (
    <form onSubmit={onSubmit} className="surface form-card">
      <div className="form-grid">
      <label className="field">
        <span>Product name</span>
        <input type="text" name="name" value={formData.name} onChange={onChange} placeholder="e.g. Honeywell Semolina" required />
      </label>

      <label className="field">
        <span>Brand</span>
        <select name="brand" value={formData.brand} onChange={onChange} required>
          <option value="">Select Brand</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Category</span>
        <select name="category" value={formData.category} onChange={onChange} required>
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Available sizes</span>
        <select name="sizes" multiple value={formData.sizes.map(String)} onChange={onChange} className="h-32" required>
          {sizes.map((size) => (
            <option key={size.id} value={size.id}>{size.size} {size.size_unit}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Description</span>
        <textarea name="description" value={formData.description} onChange={onChange} rows={4} placeholder="A short note that helps staff identify this product" />
      </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="button button--primary" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
      </div>
    </form>
  );
};

export default WareForm;
