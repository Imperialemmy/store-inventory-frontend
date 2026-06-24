import { useState } from "react";

interface DataItem {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface DataTableProps {
  data: DataItem[];
  fetchRelatedItems: (id: number) => Promise<Product[]>; // Fetch related products
  onEdit: (item: DataItem) => void;
  onDelete: (id: number) => void;
  title: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, fetchRelatedItems, onEdit, onDelete, title }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [relatedItems, setRelatedItems] = useState<{ [key: number]: Product[] }>({});

  const toggleExpand = async (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      if (!relatedItems[id]) {
        const items = await fetchRelatedItems(id);
        setRelatedItems({ ...relatedItems, [id]: items });
      }
      setExpandedRow(id);
    }
  };

  return (
    <div className="surface" style={{ padding: "20px" }}>
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--leaf-950)" }}>{title}</h1>
      <table className="glass-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <>
              <tr key={item.id}>
                <td style={{ fontWeight: 650, color: "var(--ink-900)" }}>{item.name}</td>
                <td>
                  <div className="flex" style={{ gap: "8px", flexWrap: "wrap" }}>
                    <button className="button button--primary button--small" onClick={() => onEdit(item)}>
                      Edit
                    </button>
                    <button className="button button--danger button--small" onClick={() => onDelete(item.id)}>
                      Delete
                    </button>
                    <button className="button button--accent button--small" onClick={() => toggleExpand(item.id)}>
                      {expandedRow === item.id ? "Hide Products" : "View Products"}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedRow === item.id && relatedItems[item.id] && (
                <tr>
                  <td colSpan={2} className="glass-subrow">
                    <h2 className="text-md font-semibold" style={{ color: "var(--leaf-800)" }}>Products:</h2>
                    <ul>
                      {relatedItems[item.id].map((product) => (
                        <li key={product.id} className="ml-4 text-sm">{product.name}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
