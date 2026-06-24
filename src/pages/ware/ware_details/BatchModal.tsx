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
    <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
      <div className="glass-panel p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--leaf-950)' }}>
          {batchToEdit ? 'Edit Batch' : 'Add Batch'}
        </h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="field">
            <span>Lot Number</span>
            <input
              type="text"
              placeholder="Lot Number"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Quantity</span>
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Manufacturing Date</span>
            <input
              type="date"
              value={manufacturingDate}
              onChange={(e) => setManufacturingDate(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Expiry Date</span>
            <input
              type="date"
              placeholder="Expiry Date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </label>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="button button--ghost">
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              {batchToEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchModal;
