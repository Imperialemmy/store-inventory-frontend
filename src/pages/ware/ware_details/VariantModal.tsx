// src/pages/ware/VariantModal.tsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Size, Variant} from '../../../shared/modal_for_variants/variant_data'; // adjust path as needed


interface Props {
  isOpen: boolean;
  onClose: () => void;
  wareId: number;
  wareSizes: Size[];
  wareVariants: Variant[];
  variantToEdit: Variant | null;
}

const VariantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  wareId,
  wareSizes,
  wareVariants,
  variantToEdit
}) => {
  const [formData, setFormData] = useState({
    size: '',
    price: '',
    is_available: true,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (variantToEdit) {
      setFormData({
        size: variantToEdit.size_detail.id.toString(),
        price: variantToEdit.price,
        is_available: variantToEdit.is_available,
      });
    } else {
      setFormData({ size: '', price: '', is_available: true });
    }
    setError('');
  }, [variantToEdit]);

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
    setError('');

    const payload = {
      size: Number(formData.size),
      price: formData.price,
      is_available: formData.is_available,
    };

    try {
      if (variantToEdit) {
        await api.put(`/variants/${variantToEdit.id}/`, payload);
      } else {
        await api.post(`/variants/`, { ...payload, ware: wareId });
      }
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError("This size has already been added to this product.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // Filter out already-used sizes, except for the one being edited
  const usedSizeIds = wareVariants
    .filter((v) => !variantToEdit || v.id !== variantToEdit.id)
    .map((v) => v.size_detail.id);

  const filteredSizes = wareSizes.filter((size) => !usedSizeIds.includes(size.id));

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
      <div className="glass-panel p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--leaf-950)' }}>
          {variantToEdit ? 'Edit Product Type' : 'Add Product Type'}
        </h2>

        {error && <p className="notice notice--error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="form-grid">
          <label className="field">
            <span>Size</span>
            <select name="size" value={formData.size} onChange={handleChange}>
              <option value="">Select size</option>
              {filteredSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.size} {size.size_unit}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Price</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
            />
          </label>

          <label className="field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
              style={{ width: '18px', height: '18px' }}
            />
            <span>Available</span>
          </label>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="button button--ghost">
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              {variantToEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariantModal;
