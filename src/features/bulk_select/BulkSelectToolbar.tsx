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
    <div className="search-box" style={{ gridTemplateColumns: '1fr auto' }}>
      <label className="inventory-list__name" style={{ gap: '10px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          style={{ width: '18px', height: '18px' }}
        />
        <span style={{ fontWeight: 700 }}>
          {allSelected ? "All selected" : `${selectedIds.length} selected`}
        </span>
      </label>

      {selectedIds.length > 0 && (
        <div className="flex" style={{ gap: '8px' }}>
          <button className="button button--danger button--small" onClick={onDeleteSelected}>
            Delete
          </button>
          <button className="button button--ghost button--small" onClick={onClearSelection}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkSelectToolbar;
