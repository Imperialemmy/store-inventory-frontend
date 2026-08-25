import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, History } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";
import { queryKeys } from "../../query/queryKeys";

interface AuditEntry {
  id: number;
  user_name: string;
  action: "create" | "update" | "delete";
  action_display: string;
  model_name: string;
  object_repr: string | null;
  summary: string;
  timestamp: string;
}

interface AuditPage {
  results: AuditEntry[];
  count: number;
  total_pages: number;
}

const ACTIONS = [
  { value: "", label: "All" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
] as const;

const actionIcon = { create: Plus, update: Pencil, delete: Trash2 };
const actionColor: Record<string, string> = {
  create: "var(--ok)",
  update: "var(--brand)",
  delete: "var(--danger)",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short",
  }).format(new Date(iso));

const ActivityPage = () => {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (action) params.set("action", action);

  const { data, isLoading, isError } = useQuery<AuditPage>({
    queryKey: queryKeys.activity(params.toString()),
    queryFn: async () => {
      const response = await api.get(`/audit-logs/?${params.toString()}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const entries = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;

  const setFilter = (value: string) => { setAction(value); setPage(1); };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Audit trail"
        title="Activity"
        description="Every create, update and delete across the store — who did it and when."
      />

      <div className="filter-chips" style={{ marginBottom: 14 }}>
        {ACTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`filter-chip${action === item.value ? " filter-chip--active" : ""}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="surface list-surface">
        {isLoading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : isError ? (
          <div className="empty-state"><strong>Could not load the activity log.</strong></div>
        ) : entries.length === 0 ? (
          <div className="empty-state"><strong>No activity recorded yet.</strong></div>
        ) : (
          <ul className="activity-list">
            {entries.map((entry) => {
              const Icon = actionIcon[entry.action] ?? History;
              return (
                <li key={entry.id} className="activity-row">
                  <span className="activity-row__icon" style={{ color: actionColor[entry.action], background: "var(--hover)" }}>
                    <Icon size={16} />
                  </span>
                  <div className="activity-row__body">
                    <span className="activity-row__summary">{entry.summary}</span>
                    <span className="activity-row__meta">{entry.model_name} · {when(entry.timestamp)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {totalPages > 1 && (
        <div className="activity-pager">
          <button type="button" className="button button--ghost button--small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft size={16} /> Newer
          </button>
          <span className="muted">Page {page} of {totalPages}</span>
          <button type="button" className="button button--ghost button--small" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Older <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
