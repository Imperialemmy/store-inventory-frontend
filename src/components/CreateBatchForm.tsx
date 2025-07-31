// src/components/CreateBatchForm.tsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Variant {
  id: number;
  size_detail: {
    size: string;
    size_unit: string;
  };
}

interface CreateBatchFormProps {
  wareId: number;
  onSuccess?: () => void;
}

const CreateBatchForm: React.FC<CreateBatchFormProps> = ({ wareId, onSuccess }) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [formData, setFormData] = useState({
    variant: '',
    quantity: '',
    manufacturing_date: '',
    expiry_date: '',
    lot_number: '',
    is_expired: false,
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/wares/${wareId}/`)
      .then((res) => {
        setVariants(res.data.variants); // variants already filtered to this ware
      })
      .catch(() => setError('Failed to load variants'));
  }, [wareId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.post(
        '/batches/',
        {
          ...formData,
          variant: parseInt(formData.variant),
          quantity: parseInt(formData.quantity),
        },
      );

      setSuccessMessage('Batch created successfully!');
      setFormData({
        variant: '',
        quantity: '',
        manufacturing_date: '',
        expiry_date: '',
        lot_number: '',
        is_expired: false,
      });

      if (onSuccess) onSuccess(); // tell parent modal we succeeded
    } catch (err) {
      console.error(err);
      setError('Failed to create batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Variant */}
      <div>
        <label htmlFor="variant" className="block mb-1 font-medium text-gray-700">
          Variant
        </label>
        <select
          id="variant"
          name="variant"
          value={formData.variant}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select variant</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.size_detail.size}
              {v.size_detail.size_unit}
            </option>
          ))}
        </select>
      </div>

      {/* Lot Number */}
      <div>
        <label htmlFor="lot_number" className="block mb-1 font-medium text-gray-700">
          Lot Number
        </label>
        <input
          type="text"
          id="lot_number"
          name="lot_number"
          value={formData.lot_number}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stock */}
      <div>
        <label htmlFor="quantity" className="block mb-1 font-medium text-gray-700">
          Quantity
        </label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          required
          min={0}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Manufacture Date */}
      <div>
        <label htmlFor="manufacturing_date" className="block mb-1 font-medium text-gray-700">
          Manufacturing Date
        </label>
        <input
          type="date"
          id="manufacturing_date"
          name="manufacturing_date"
          value={formData.manufacturing_date}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Expiry Date */}
      <div>
        <label htmlFor="expiry_date" className="block mb-1 font-medium text-gray-700">
          Expiry Date
        </label>
        <input
          type="date"
          id="expiry_date"
          name="expiry_date"
          value={formData.expiry_date}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Is Expired */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_expired"
          name="is_expired"
          checked={formData.is_expired}
          onChange={handleChange}
          className="h-5 w-5"
        />
        <label htmlFor="is_expired" className="font-medium text-gray-700">
          Mark as Expired
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded text-white font-semibold ${
          loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
        } transition duration-200`}
      >
        {loading ? 'Creating...' : 'Create Batch'}
      </button>

      {successMessage && <p className="text-green-600 text-center">{successMessage}</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}
    </form>
  );
};

export default CreateBatchForm;
