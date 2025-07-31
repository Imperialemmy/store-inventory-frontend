import React from "react";

interface BulkSelectToolbarProps {
  items: { id: number }[];
  selectedIds: number[];
  onToggleAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

const BulkSelectToolbar: React.FC<BulkSelectToolbarProps> = ({
  items,
  selectedIds,
  onToggleAll,
  onClearSelection,
  onDeleteSelected,
}) => {
  const allSelected = selectedIds.length === items.length;

  return (
    <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded">
      <div>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
        />
        <span className="ml-2">
          {allSelected ? "All selected" : `${selectedIds.length} selected`}
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="space-x-2">
          <button
            className="bg-red-500 text-white px-3 py-1 rounded"
            onClick={onDeleteSelected}
          >
            Delete
          </button>
          <button
            className="bg-gray-300 px-3 py-1 rounded"
            onClick={onClearSelection}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkSelectToolbar;
