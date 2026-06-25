import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

interface Size {
  id: number;
  size: string;
  size_unit: string;
}

interface WareVariantFormData {
  size: number | "";
  sku: string;
  stock: number | "";
  retail_price: number | "";
  wholesale_price: number | "";
  reorder_point: number | "";
}

const WareVariantForm = () => {
  const { wareId, variantId } = useParams<{ wareId: string; variantId?: string }>();
  const navigate = useNavigate();

  const [sizes, setSizes] = useState<Size[]>([]);
  const [formData, setFormData] = useState<WareVariantFormData>({
    size: "",
    sku: "",
    stock: "",
    retail_price: "",
    wholesale_price: "",
    reorder_point: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch sizes for dropdown
    api.get("/sizes/").then((res) => setSizes(res.data.results || res.data));
  }, []);

  useEffect(() => {
    // If editing, fetch variant data
    if (variantId) {
      setLoading(true);
      api
        .get(`/variants/${variantId}/`)
        .then((res) => {
          const v = res.data;
          setFormData({
            size: v.size.id ?? v.size,
            sku: v.sku || "",
            stock: v.stock || "",
            retail_price: v.retail_price || "",
            wholesale_price: v.wholesale_price || "",
            reorder_point: v.reorder_point ?? "",
          });
        })
        .finally(() => setLoading(false));
    }
  }, [variantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "size" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wareId) {
      alert("Invalid Ware ID");
      return;
    }
    setLoading(true);

    const payload = {
      ...formData,
      ware: Number(wareId),
      size: Number(formData.size),
      stock: Number(formData.stock),
      retail_price: Number(formData.retail_price) || 0,
      wholesale_price: Number(formData.wholesale_price) || 0,
      reorder_point: Number(formData.reorder_point) || 0,
    };

    try {
      if (variantId) {
        await api.put(`/variants/${variantId}/`, payload);
        alert("Variant updated successfully");
      } else {
        await api.post("/variants/", payload);
        alert("Variant created successfully");
      }
      navigate(`/wares/${wareId}`);
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save variant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <div className="surface form-card">
      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--leaf-950)" }}>
        {variantId ? "Edit Variant" : "Add New Variant"}
      </h2>

      <form onSubmit={handleSubmit} className="form-grid">
        <label className="field" htmlFor="size">
          <span>Size</span>
          <select
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            required
          >
            <option value="">Select Size</option>
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.size} {size.size_unit}
              </option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor="sku">
          <span>SKU</span>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="SKU (optional)"
          />
        </label>

        <label className="field" htmlFor="stock">
          <span>Stock</span>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min={0}
          />
        </label>

        <label className="field" htmlFor="retail_price">
          <span>Retail price (₦)</span>
          <input
            type="number"
            id="retail_price"
            name="retail_price"
            value={formData.retail_price}
            onChange={handleChange}
            required
            min={0}
            step="0.01"
          />
        </label>

        <label className="field" htmlFor="wholesale_price">
          <span>Wholesale price (₦)</span>
          <input
            type="number"
            id="wholesale_price"
            name="wholesale_price"
            value={formData.wholesale_price}
            onChange={handleChange}
            min={0}
            step="0.01"
          />
        </label>

        <label className="field" htmlFor="reorder_point">
          <span>Reorder point</span>
          <input
            type="number"
            id="reorder_point"
            name="reorder_point"
            value={formData.reorder_point}
            onChange={handleChange}
            min={0}
            placeholder="Alert when stock falls to this level"
          />
        </label>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="button button--primary">
            {loading ? "Saving..." : variantId ? "Update Variant" : "Create Variant"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default WareVariantForm;
