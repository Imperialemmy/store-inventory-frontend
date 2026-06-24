import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useParams } from 'react-router-dom';
import VariantModal from './VariantModal';
import BatchModal from './BatchModal';
import { useUserRole } from "../../../hooks/useUserRole";
import { Batch, Variant, Ware } from '../../../shared/modal_for_variants/variant_data'; // adjust path as needed


const WareDetail: React.FC = () => {
  const { wareId } = useParams<{ wareId: string }>();
  const [ware, setWare] = useState<Ware | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const userRole = useUserRole();
  // Edit mode states
  const [variantToEdit, setVariantToEdit] = useState<Variant | null>(null);
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null);

  const fetchWare = useCallback(async () => {
  try {
    setLoading(true);
    const res = await api.get<Ware>(`/wares/${wareId}/`);
    setWare(res.data);
  } catch (error) {
    console.error('Failed to fetch ware:', error);
  } finally {
    setLoading(false);
  }
}, [wareId]);

useEffect(() => {
  fetchWare();
}, [fetchWare]);

  const formatPrice = (price: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(price));

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      await api.delete(`/variants/${variantId}/`);
      await fetchWare();
    } catch (error) {
      console.error('Failed to delete variant:', error);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      await api.delete(`/batches/${batchId}/`);
      await fetchWare();
    } catch (error) {
      console.error('Failed to delete batch:', error);
    }
  };

  if (loading) return <div className="page-container"><p className="text-center" style={{ color: 'var(--ink-600)' }}>Loading...</p></div>;
  if (!ware) return <div className="page-container"><div className="surface empty-state"><strong>Ware not found.</strong></div></div>;

  return (
    <div className="page-container">
      <h2 className="page-header" style={{ marginBottom: '20px' }}>
        <span style={{ color: 'var(--leaf-950)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-.04em' }}>{ware.name}</span>
      </h2>

      <div className="surface form-card">
        {/* Ware Info */}
        <p><strong>Brand:</strong> {ware.brand_detail.name}</p>
        <p><strong>Category:</strong> {ware.category_detail.name}</p>
        <p className="mb-4"><strong>Description:</strong> {ware.description}</p>

        <p className="mb-6">
          <strong>Sizes:</strong>{' '}
          {ware.size_detail.length > 0 ? (
            ware.size_detail.map((s, index) => (
              <span key={index} className="role-badge" style={{ marginRight: '8px', marginBottom: '4px' }}>
                {s.size}{s.size_unit}
              </span>
            ))
          ) : (
            <span className="text-sm italic" style={{ color: 'var(--ink-600)' }}>Not updated yet.</span>
          )}
        </p>

        {/* Add Variant Button */}
        <div className="flex flex-wrap gap-4 mb-6">
          {userRole.role === 'admin' && (
          <button
            onClick={() => {
              setVariantToEdit(null);
              setShowVariantModal(true);
            }}
            className="button button--primary"
          >
            Add Product Type
          </button>
          )}
        </div>

        {/* Variants */}
        <div>
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--leaf-950)' }}>Product types</h3>

          {ware.variants.length === 0 ? (
            <p className="italic" style={{ color: 'var(--ink-600)' }}>Not updated yet.</p>
          ) : (
            ware.variants.map((variant) => (
              <div
                key={variant.id}
                className="glass-panel p-4 mb-4"
                style={{ borderRadius: '16px' }}
              >
                {/* Flex container for variant info and buttons */}
                <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  {/* Left side: variant details */}
                  <div className="space-x-6 whitespace-nowrap">
                    <span><strong>Size:</strong> {variant.size_detail.size}{variant.size_detail.size_unit}</span>
                    <span><strong>Price:</strong> {formatPrice(variant.price)}</span>
                    <span><strong>Available:</strong> {variant.is_available ? 'Yes' : 'No'}</span>
                  </div>

                  {/* Right side: buttons */}
                  <div className="flex gap-3 flex-shrink-0" style={{ flexWrap: 'wrap' }}>
                    {userRole.role === 'admin' && (
                    <button
                      onClick={() => {
                        setVariantToEdit(variant);
                        setShowVariantModal(true);
                      }}
                      className="button button--primary button--small"
                    >
                      Edit
                    </button>
                    )}

                    {userRole.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteVariant(variant.id)}
                      className="button button--danger button--small"
                    >
                      Delete
                    </button>

                    )}

                      {userRole.role === 'admin' && (
                    <button
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setBatchToEdit(null);
                        setShowBatchModal(true);
                      }}
                      className="button button--accent button--small"
                    >
                      Add Stock
                    </button>
                      )}
                  </div>
                </div>

                {/* Batches */}
                <div className="ml-4">
                  <h4 className="text-md font-semibold mb-2" style={{ color: 'var(--leaf-800)' }}>Batches:</h4>
                  {variant.batches && variant.batches.length > 0 ? (
                    <ul className="list-disc ml-5 space-y-2" style={{ color: 'var(--ink-900)' }}>
                      {variant.batches.map((batch) => (
                        <li key={batch.id}>
                          <p><strong>Batch Number:</strong> {batch.lot_number}</p>
                          <p><strong>Quantity:</strong> {batch.quantity}</p>
                          <p><strong>Manufacture Date:</strong> {formatDate(batch.manufacturing_date)}</p>
                          <p><strong>Expiry Date:</strong> {formatDate(batch.expiry_date)}</p>
                          <p><strong>Expired:</strong> {batch.is_expired ? 'Yes' : 'No'}</p>

                          {/* Edit & Delete buttons for Batch */}
                          <div className="flex gap-2 mt-2">
                          {userRole.role === 'admin' && (
                            <button
                              onClick={() => {
                                setBatchToEdit(batch);
                                setSelectedVariantId(variant.id);
                                setShowBatchModal(true);
                              }}
                              className="button button--primary button--small"
                            >
                              Edit Batch
                            </button>
                          )}

                          {userRole.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="button button--danger button--small"
                            >
                              Delete Batch
                            </button>
                          )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--ink-600)' }}>No batches added yet.</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <VariantModal
        isOpen={showVariantModal}
        onClose={() => {
          setShowVariantModal(false);
          setVariantToEdit(null);
          fetchWare();
        }}
        wareId={ware.id}
        variantToEdit={variantToEdit}
        wareSizes={ware.size_detail}
        wareVariants={ware.variants} // ✅ NEW
      />

      <BatchModal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setBatchToEdit(null);
          setSelectedVariantId(null);
          fetchWare();
        }}
        wareId={ware.id}
        variantId={selectedVariantId}
        batchToEdit={batchToEdit}
      />
    </div>
  );
};

export default WareDetail;
