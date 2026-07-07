import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";

interface SizeDetail {
  size: string;
  size_unit: string | null;
}

interface LowStockVariant {
  id: number;
  ware: number;
  ware_name: string;
  size_detail: SizeDetail;
  stock: number;
  reorder_point: number;
}

export default function LowStockPage() {
  const [variants, setVariants] = useState<LowStockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/variants/low-stock/")
      .then((res) => setVariants(res.data.results ?? res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Alerts"
        title="Low stock"
        description="Variants at or below their reorder point. Receive new stock to clear them."
      />

      {loading && <p>Loading…</p>}
      {error && <div className="notice notice--error">Could not load low-stock items.</div>}

      {!loading && !error && variants.length === 0 && (
        <div className="notice notice--success">Nothing to reorder — all stock is above its reorder point.</div>
      )}

      {variants.length > 0 && (
        <div className="surface list-surface" style={{ overflowX: "auto" }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th style={{ textAlign: "right" }}>In stock</th>
                <th style={{ textAlign: "right" }}>Reorder point</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>{v.ware_name}</td>
                  <td>
                    {v.size_detail?.size} {v.size_detail?.size_unit ?? ""}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--danger)", fontWeight: 700 }}>{v.stock}</td>
                  <td style={{ textAlign: "right" }}>{v.reorder_point}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link className="inventory-list__open" to={`/wares/${v.ware}`}>
                      View product →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
