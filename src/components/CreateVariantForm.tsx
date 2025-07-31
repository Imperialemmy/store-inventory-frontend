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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Size Selector */}
      <div>
        <label htmlFor="size" className="block mb-1 font-medium text-gray-700">
          Size
        </label>
        <select
          id="size"
          name="size"
          value={formData.size}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="block mb-1 font-medium text-gray-700">
          Price
        </label>
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
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Availability */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_available"
          name="is_available"
          checked={formData.is_available}
          onChange={handleChange}
          className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="is_available" className="font-medium text-gray-700">
          Available
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded text-white font-semibold ${
          loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        } transition-colors duration-300`}
      >
        {loading ? 'Creating...' : 'Create Variant'}
      </button>

      {/* Success & Error Messages */}
      {successMessage && (
        <p className="text-green-600 font-medium text-center">{successMessage}</p>
      )}
      {error && <p className="text-red-600 font-medium text-center">{error}</p>}
    </form>
  );
};

export default CreateVariantForm;
