import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wareId: number;
  variantId: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  batchToEdit?: any | null;
}

const BatchModal: React.FC<Props> = ({ isOpen, onClose, variantId, batchToEdit }) => {
  const [lotNumber, setLotNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (batchToEdit) {
      setLotNumber(batchToEdit.lot_number);
      setQuantity(batchToEdit.quantity);
      setManufacturingDate(batchToEdit.manufacturing_date);
      setExpiryDate(batchToEdit.expiry_date);
    } else {
      setLotNumber('');
      setQuantity('');
      setManufacturingDate('');
      setExpiryDate('');
    }
  }, [batchToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      variant: variantId,
      lot_number: lotNumber,
      quantity,
      manufacturing_date: manufacturingDate,
      expiry_date: expiryDate,
    };

    try {
      if (batchToEdit) {
        await api.patch(`/batches/${batchToEdit.id}/`, payload);
      } else {
        await api.post('/batches/', payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to submit batch:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {batchToEdit ? 'Edit Batch' : 'Add Batch'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Lot Number"
            value={lotNumber}
            onChange={(e) => setLotNumber(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />

          <label className="block font-medium mb-1">Manufacturing Date</label>
          <input
            type="date"
            value={manufacturingDate}
            onChange={(e) => setManufacturingDate(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />

          <label className="block font-medium mb-1">Expiry Date</label>
          <input
            type="date"
            placeholder="Expiry Date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              {batchToEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchModal;
