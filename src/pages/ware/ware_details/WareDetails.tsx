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
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventory · Product</p>
          <h1>{ware.name}</h1>
          {ware.description && <p className="page-header__description">{ware.description}</p>}
        </div>
        {userRole.canManage && (
          <div className="page-actions page-header__action">
            <button
              className="button button--primary"
              onClick={() => {
                setVariantToEdit(null);
                setShowVariantModal(true);
              }}
            >
              Add product type
            </button>
          </div>
        )}
      </div>

      {/* Product profile */}
      <section className="surface form-card" style={{ marginBottom: '18px' }}>
        <dl className="customer-dl">
          <div><dt>Brand</dt><dd>{ware.brand_detail.name}</dd></div>
          <div><dt>Category</dt><dd>{ware.category_detail.name}</dd></div>
          <div>
            <dt>Sizes</dt>
            <dd>
              {ware.size_detail.length > 0 ? (
                ware.size_detail.map((s, index) => (
                  <span key={index} className="customer-chip" style={{ marginRight: '8px' }}>
                    {s.size}{s.size_unit}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--ink-600)' }}>Not updated yet.</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Variants */}
      <h3 style={{ margin: '0 0 12px', color: 'var(--ink-900)' }}>Product types</h3>
      {ware.variants.length === 0 ? (
        <div className="surface empty-state">
          <strong>No product types yet</strong>
          <p>Add a size and price to start tracking stock for this product.</p>
        </div>
      ) : (
        ware.variants.map((variant) => (
          <section key={variant.id} className="surface" style={{ marginBottom: '16px', overflow: 'hidden' }}>
            <div className="search-box" style={{ gridTemplateColumns: '1fr auto' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                <strong style={{ color: 'var(--ink-900)', fontSize: '1rem' }}>
                  {variant.size_detail.size}{variant.size_detail.size_unit}
                </strong>
                <span>Retail <strong style={{ color: 'var(--brand)' }}>{formatPrice((variant as typeof variant & { retail_price?: string }).retail_price ?? variant.price)}</strong></span>
                <span>Wholesale <strong style={{ color: 'var(--brand)' }}>{formatPrice((variant as typeof variant & { wholesale_price?: string }).wholesale_price ?? variant.price)}</strong></span>
                <span className="customer-chip">{variant.is_available ? 'In stock' : 'Out of stock'}</span>
              </div>
              {(userRole.canManage || userRole.canStock) && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {userRole.canStock && (
                    <button
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setBatchToEdit(null);
                        setShowBatchModal(true);
                      }}
                      className="button button--accent button--small"
                    >
                      Add stock
                    </button>
                  )}
                  {userRole.canManage && (
                    <>
                      <button
                        onClick={() => {
                          setVariantToEdit(variant);
                          setShowVariantModal(true);
                        }}
                        className="button button--ghost button--small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVariant(variant.id)}
                        className="button button--danger button--small"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {variant.batches && variant.batches.length > 0 ? (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th>Manufactured</th>
                    <th>Expires</th>
                    <th>Status</th>
                    {userRole.canStock && <th />}
                  </tr>
                </thead>
                <tbody>
                  {variant.batches.map((batch) => (
                    <tr key={batch.id}>
                      <td style={{ fontWeight: 650 }}>{batch.lot_number || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{batch.quantity}</td>
                      <td>{formatDate(batch.manufacturing_date)}</td>
                      <td>{formatDate(batch.expiry_date)}</td>
                      <td>
                        <span style={{ color: batch.is_expired ? 'var(--danger)' : 'var(--brand)', fontWeight: 700, fontSize: '.82rem' }}>
                          {batch.is_expired ? 'Expired' : 'Fresh'}
                        </span>
                      </td>
                      {userRole.canStock && (
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setBatchToEdit(batch);
                                setSelectedVariantId(variant.id);
                                setShowBatchModal(true);
                              }}
                              className="button button--ghost button--small"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="button button--danger button--small"
                            >
                              Delete
                            </button>
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ margin: 0, padding: '14px 18px', color: 'var(--ink-600)' }}>No batches added yet.</p>
            )}
          </section>
        ))
      )}

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
