import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import GenericList from "./GenericList";
import BulkSelectToolbar from "../../features/bulk_select/BulkSelectToolbar";
import { useUserRole } from "../../hooks/useUserRole";

interface ListPageProps<T extends { id: number }> {
  title: string;
  apiEndpoint: string;
  itemKey: (item: T) => number;
  itemNameSelector: (item: T) => string;
  navigateTo: (id: number) => string;
}

function ListPage<T extends { id: number }>({ title, apiEndpoint, itemKey, itemNameSelector, navigateTo }: ListPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const userRole = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(apiEndpoint)
      .then(res => setItems(res.data.results || res.data))
      .catch(err => console.error("Error fetching items:", err));
  }, [apiEndpoint]);

  const handleDeleteSelected = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Are you sure you want to delete the selected items?")) return;

    try {
      await api.post(`${apiEndpoint}bulk-delete/`, { ids: selectedIds });
      setItems((prev) => prev.filter((item) => !selectedIds.includes(itemKey(item))));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <GenericList
      title={title}
      items={items}
      itemKey={itemKey}
      onItemClick={(id: string | number) => navigate(navigateTo(Number(id)))}
      enableSelection={userRole?.role === "admin"}
      renderToolbar={(selectedIds, clear, toggleAll) =>
        userRole.role === "admin" && (
          <BulkSelectToolbar
            items={items}
            selectedIds={selectedIds as number[]}
            onToggleAll={toggleAll}
            onClearSelection={clear}
            onDeleteSelected={() => handleDeleteSelected(selectedIds as number[])}
          />
        )
      }
      renderItem={(item, isSelected, toggleSelect, selectionMode) => (
        <div className="flex justify-between items-center p-4 border rounded-md shadow-sm bg-white hover:bg-gray-100 transition cursor-pointer">
          <div className="flex items-center space-x-2">
            {selectionMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={toggleSelect}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <span className="text-gray-700 cursor-pointer">{itemNameSelector(item)}</span>
          </div>
        </div>
      )}
    />
  );
}

export default ListPage;
