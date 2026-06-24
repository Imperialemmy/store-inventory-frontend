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
    <form onSubmit={handleSubmit} className="form-grid">
      {/* Variant */}
      <label className="field" htmlFor="variant">
        <span>Variant</span>
        <select
          id="variant"
          name="variant"
          value={formData.variant}
          onChange={handleChange}
          required
        >
          <option value="">Select variant</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.size_detail.size}
              {v.size_detail.size_unit}
            </option>
          ))}
        </select>
      </label>

      {/* Lot Number */}
      <label className="field" htmlFor="lot_number">
        <span>Lot Number</span>
        <input
          type="text"
          id="lot_number"
          name="lot_number"
          value={formData.lot_number}
          onChange={handleChange}
          required
        />
      </label>

      {/* Stock */}
      <label className="field" htmlFor="quantity">
        <span>Quantity</span>
        <input
          type="number"
          id="quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          required
          min={0}
        />
      </label>

      {/* Manufacture Date */}
      <label className="field" htmlFor="manufacturing_date">
        <span>Manufacturing Date</span>
        <input
          type="date"
          id="manufacturing_date"
          name="manufacturing_date"
          value={formData.manufacturing_date}
          onChange={handleChange}
          required
        />
      </label>

      {/* Expiry Date */}
      <label className="field" htmlFor="expiry_date">
        <span>Expiry Date</span>
        <input
          type="date"
          id="expiry_date"
          name="expiry_date"
          value={formData.expiry_date}
          onChange={handleChange}
          required
        />
      </label>

      {/* Is Expired */}
      <label className="field" htmlFor="is_expired" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          id="is_expired"
          name="is_expired"
          checked={formData.is_expired}
          onChange={handleChange}
          style={{ width: '18px', height: '18px' }}
        />
        <span>Mark as Expired</span>
      </label>

      {/* Submit */}
      <button type="submit" disabled={loading} className="button button--primary w-full">
        {loading ? 'Creating...' : 'Create Batch'}
      </button>

      {successMessage && <p className="notice notice--success" role="status">{successMessage}</p>}
      {error && <p className="notice notice--error" role="alert">{error}</p>}
    </form>
  );
};

export default CreateBatchForm;
