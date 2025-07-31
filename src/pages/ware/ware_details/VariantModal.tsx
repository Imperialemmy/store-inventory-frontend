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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {variantToEdit ? 'Edit Product Type' : 'Add Product Type'}
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Size</label>
            <select
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select size</option>
              {filteredSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.size} {size.size_unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
              className="mr-2"
            />
            <label>Available</label>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              {variantToEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariantModal;
