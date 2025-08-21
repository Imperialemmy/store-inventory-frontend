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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{title}</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <>
              <tr key={item.id} className="border">
                <td className="p-2">{item.name}</td>
                <td className="p-2">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded"
                    onClick={() => onDelete(item.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                    onClick={() => toggleExpand(item.id)}
                  >
                    {expandedRow === item.id ? "Hide Products" : "View Products"}
                  </button>
                </td>
              </tr>
              {expandedRow === item.id && relatedItems[item.id] && (
                <tr>
                  <td colSpan={2} className="p-2 bg-gray-100">
                    <h2 className="text-md font-semibold">Products:</h2>
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
