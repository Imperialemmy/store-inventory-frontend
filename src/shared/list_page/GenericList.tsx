import { CheckSquare, Plus, Search } from "lucide-react";
import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";

interface GenericListProps<T> {
  title: string;
  description?: string;
  createPath?: string;
  createLabel?: string;
  items: T[];
  itemKey: (item: T) => number | string;
  renderItem: (item: T, isSelected: boolean, toggleSelect: () => void, selectionMode: boolean) => ReactNode;
  enableSelection?: boolean;
  onItemClick?: (id: number | string) => void;
  renderToolbar?: (selectedIds: (number | string)[], clearSelection: () => void, toggleAll: () => void) => ReactNode;
  itemsPerPage?: number;
}

function GenericList<T>({
  title,
  description = "Search, review, and open a record to see its inventory details.",
  createPath,
  createLabel = "Add new",
  items,
  itemKey,
  renderItem,
  enableSelection = false,
  onItemClick,
  renderToolbar,
  itemsPerPage = 10,
}: GenericListProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(
    () => items.filter((item) => JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())),
    [items, searchQuery]
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelect = (id: number | string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };
  const toggleAll = () => setSelectedIds(
    selectedIds.length === filteredItems.length ? [] : filteredItems.map(itemKey)
  );
  const clearSelection = () => setSelectedIds([]);

  const openItem = (id: number | string) => {
    if (!selectionMode) onItemClick?.(id);
  };
  const handleItemKeyDown = (event: KeyboardEvent, id: number | string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItem(id);
    }
  };

  const action = (
    <div className="page-actions">
      {enableSelection && (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => { setSelectionMode((current) => !current); clearSelection(); }}
        >
          <CheckSquare size={16} /> {selectionMode ? "Finish selecting" : "Select items"}
        </button>
      )}
      {createPath && (
        <Link className="button button--primary" to={createPath}><Plus size={17} /> {createLabel}</Link>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader eyebrow="Inventory index" title={title} description={description} action={action} />
      <section className="surface list-surface">
        <label className="search-box">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Search {title.toLowerCase()}</span>
          <input
            type="search"
            placeholder={`Search ${title.toLowerCase()}…`}
            value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }}
          />
          <small>{filteredItems.length} {filteredItems.length === 1 ? "record" : "records"}</small>
        </label>

        {selectionMode && renderToolbar?.(selectedIds, clearSelection, toggleAll)}

        {paginatedItems.length === 0 ? (
          <div className="empty-state">
            <strong>No matching records</strong>
            <p>Try a shorter search or add the first item.</p>
          </div>
        ) : (
          <ul className="inventory-list">
            {paginatedItems.map((item) => {
              const id = itemKey(item);
              return (
                <li
                  key={id}
                  className="inventory-list__row"
                  onClick={() => openItem(id)}
                  onKeyDown={(event) => handleItemKeyDown(event, id)}
                  tabIndex={!selectionMode && onItemClick ? 0 : undefined}
                  role={!selectionMode && onItemClick ? "link" : undefined}
                >
                  {renderItem(item, selectedIds.includes(id), () => toggleSelect(id), selectionMode)}
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <nav className="pagination" aria-label={`${title} pages`}>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                onClick={() => setCurrentPage(page)}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}

export default GenericList;
