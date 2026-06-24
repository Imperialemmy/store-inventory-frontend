import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Size {
  id: number;
  size: string;
  size_unit: string;
}

interface CreateVariantFormProps {
  wareId: number;
  onSuccess?: () => void;
}

const CreateVariantForm: React.FC<CreateVariantFormProps> = ({ wareId }) => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [formData, setFormData] = useState({
    size: '',
    price: '',
    is_available: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch sizes from your API
    api
      .get<Size[]>('/sizes/')
      .then((response) => {
        setSizes(response.data);
      })
      .catch((error) => {
        console.error('Error fetching sizes:', error);
        setError('Failed to load sizes');
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.post(
        '/variants/',
        {
          ware: wareId,
          size: formData.size,
          price: formData.price,
          is_available: formData.is_available,
        },
        {
        }
      );
      setSuccessMessage('Product type created successfully!');
      setFormData({ size: '', price: '', is_available: true });

    } catch (err) {
      setError('Failed to create variant. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      {/* Size Selector */}
      <label className="field" htmlFor="size">
        <span>Size</span>
        <select
          id="size"
          name="size"
          value={formData.size}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            Select size
          </option>
          {sizes.map((size) => (
            <option key={size.id} value={size.id}>
              {size.size}
              {size.size_unit}
            </option>
          ))}
        </select>
      </label>

      {/* Price */}
      <label className="field" htmlFor="price">
        <span>Price</span>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="Enter price"
          required
          min="0"
          step="0.01"
        />
      </label>

      {/* Availability */}
      <label className="field" htmlFor="is_available" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          id="is_available"
          name="is_available"
          checked={formData.is_available}
          onChange={handleChange}
          style={{ width: '18px', height: '18px' }}
        />
        <span>Available</span>
      </label>

      {/* Submit Button */}
      <button type="submit" disabled={loading} className="button button--primary w-full">
        {loading ? 'Creating...' : 'Create Variant'}
      </button>

      {/* Success & Error Messages */}
      {successMessage && <p className="notice notice--success" role="status">{successMessage}</p>}
      {error && <p className="notice notice--error" role="alert">{error}</p>}
    </form>
  );
};

export default CreateVariantForm;
