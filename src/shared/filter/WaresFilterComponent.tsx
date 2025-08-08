import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
    axios
      .get(fetchUrl)
      .then((res) => setWares(res.data.results || res.data))
      .catch((err) => console.error("Error fetching wares:", err));
  }, [fetchUrl]);

  const filtered = wares.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>

      <input
        type="text"
        placeholder="Search wares..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full p-2 border rounded-md mb-4"
      />

      <ul className="space-y-2">
        {paginated.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No wares found.</p>
        ) : (
          paginated.map((ware) => (
            <li
              key={ware.id}
              onClick={() => navigate(`/wares/${ware.id}`)}
              className="p-4 border rounded-md shadow-sm bg-white hover:bg-gray-100 cursor-pointer transition"
            >
              {ware.name}
            </li>
          ))
        )}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
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
