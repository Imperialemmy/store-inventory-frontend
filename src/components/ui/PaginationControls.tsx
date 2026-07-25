import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageCount } from "../../types/pagination";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const pageWindow = (current: number, total: number): Array<number | "ellipsis"> => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const selected = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const pages: Array<number | "ellipsis"> = [];
  selected.forEach((page, index) => {
    if (index > 0 && page - selected[index - 1] > 1) pages.push("ellipsis");
    pages.push(page);
  });
  return pages;
};

const PaginationControls = ({
  page,
  pageSize,
  count,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) => {
  if (count <= 0) return null;
  const totalPages = pageCount(count, pageSize);
  const safePage = Math.min(page, totalPages);
  const first = (safePage - 1) * pageSize + 1;
  const last = Math.min(safePage * pageSize, count);

  return (
    <footer className="pagination" aria-label="Directory pagination">
      <span className="pagination__summary">Showing {first}–{last} of {count}</span>
      <nav className="pagination__pages" aria-label="Pages">
        <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {pageWindow(safePage, totalPages).map((item, index) => item === "ellipsis" ? (
          <span className="pagination__ellipsis" key={`ellipsis-${index}`} aria-hidden="true">…</span>
        ) : (
          <button type="button" key={item} onClick={() => onPageChange(item)} aria-current={item === safePage ? "page" : undefined}>
            {item}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(safePage + 1)} disabled={safePage >= totalPages} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </nav>
      <label className="pagination__size">
        <span>Rows</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>
    </footer>
  );
};

export default PaginationControls;
