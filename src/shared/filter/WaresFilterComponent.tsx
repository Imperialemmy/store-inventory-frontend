import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface Ware {
  id: number;
  name: string;
}

interface WaresByFilterProps {
  title: string;
  fetchUrl: string; // e.g. /api/wares/?brand=1 or /api/wares/?category=2
}

const WaresByFilter: React.FC<WaresByFilterProps> = ({ title, fetchUrl }) => {
  const [wares, setWares] = useState<Ware[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const itemsPerPage = 5;

useEffect(() => {
  api
    .get(fetchUrl)
    .then((res) => {
      const payload = res.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : [];
      setWares(list as Ware[]);
    })
    .catch((err) => console.error("Error fetching wares:", err));
}, [fetchUrl]);

const filtered = (Array.isArray(wares) ? wares : []).filter((w) =>
  (w.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="page-container">
      <h2 className="page-header" style={{ marginBottom: 0 }}>
        <span className="eyebrow" style={{ display: 'block' }}>{title}</span>
      </h2>

      <div className="surface form-card" style={{ marginBottom: '18px' }}>
        <label className="field">
          <span className="sr-only">Search wares</span>
          <input
            type="text"
            placeholder="Search wares..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </label>
      </div>

      {paginated.length === 0 ? (
        <div className="surface empty-state">
          <strong>No wares found.</strong>
        </div>
      ) : (
        <ul className="surface list-surface inventory-list">
          {paginated.map((ware) => (
            <li
              key={ware.id}
              onClick={() => navigate(`/wares/${ware.id}`)}
              className="inventory-list__row"
            >
              <div className="inventory-list__content">
                <span className="inventory-list__name"><span>{ware.name}</span></span>
                <span className="inventory-list__open">Open record →</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ border: 0, marginTop: '12px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaresByFilter;