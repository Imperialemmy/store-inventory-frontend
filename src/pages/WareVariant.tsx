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
  price: number | "";
}

const WareVariantForm = () => {
  const { wareId, variantId } = useParams<{ wareId: string; variantId?: string }>();
  const navigate = useNavigate();

  const [sizes, setSizes] = useState<Size[]>([]);
  const [formData, setFormData] = useState<WareVariantFormData>({
    size: "",
    sku: "",
    stock: "",
    price: "",
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
            size: v.size.id,
            sku: v.sku || "",
            stock: v.stock || "",
            price: v.price || "",
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
      price: Number(formData.price),
    };

    try {
      if (variantId) {
        await api.put(`/ware-variants/${variantId}/`, payload);
        alert("Variant updated successfully");
      } else {
        await api.post("/ware-variants/", payload);
        alert("Variant created successfully");
      }
      navigate(`/wares/${wareId}/variants`);
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save variant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">
        {variantId ? "Edit Variant" : "Add New Variant"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="size" className="block mb-1 font-medium">
            Size
          </label>
          <select
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Select Size</option>
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.size} {size.size_unit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sku" className="block mb-1 font-medium">
            SKU
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="SKU (optional)"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="stock" className="block mb-1 font-medium">
            Stock
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min={0}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="price" className="block mb-1 font-medium">
            Price
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min={0}
            step="0.01"
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : variantId ? "Update Variant" : "Create Variant"}
        </button>
      </form>
    </div>
  );
};

export default WareVariantForm;
