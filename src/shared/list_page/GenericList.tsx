import React, { useState, useMemo } from "react";

interface GenericListProps<T> {
  title: string;
  items: T[];
  itemKey: (item: T) => number | string;
  renderItem: (item: T, isSelected: boolean, toggleSelect: () => void, selectionMode: boolean) => React.ReactNode;
  enableSelection?: boolean;
  onItemClick?: (id: number | string) => void;
  renderToolbar?: (
    selectedIds: (number | string)[],
    clearSelection: () => void,
    toggleAll: () => void
  ) => React.ReactNode;
  itemsPerPage?: number;
}

function GenericList<T>({
  title,
  items,
  itemKey,
  renderItem,
  enableSelection = false,
  onItemClick,
  renderToolbar,
  itemsPerPage = 5,
}: GenericListProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [items, searchQuery]
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelect = (id: number | string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(itemKey));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handleItemClick = (id: number | string) => {
    if (!selectionMode && onItemClick) onItemClick(id);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {enableSelection && (
            <button
                onClick={() => {
                  setSelectionMode((prev) => !prev);
                  clearSelection();
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {selectionMode ? "Done" : "Select Items"}
            </button>
        )}
      </div>

      <div className="mb-4">
        <input
            type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full p-2 border rounded-md"
        />
      </div>

      {selectionMode && renderToolbar && renderToolbar(selectedIds, clearSelection, toggleAll)}

      <ul className="space-y-2">
        {paginatedItems.map((item) => {
          const id = itemKey(item);
          return (
              <li key={id} onClick={() => handleItemClick(id)}>
                {renderItem(item, selectedIds.includes(id), () => toggleSelect(id), selectionMode)}
              </li>
        );
        })}
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
}

export default GenericList;
