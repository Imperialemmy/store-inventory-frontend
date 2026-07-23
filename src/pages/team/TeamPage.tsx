import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";
import { queryKeys } from "../../query/queryKeys";
import { announceDataChange } from "../../query/dataChanges";

interface TeamUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "seller" | "user";
  is_active: boolean;
  date_joined: string;
}

const TeamPage = () => {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading: loading } = useQuery<TeamUser[]>({
    queryKey: queryKeys.team,
    queryFn: async () => {
      const response = await api.get("/users/");
      return response.data.results || response.data;
    },
  });

  const act = async (id: number, action: "approve" | "deactivate" | "remove") => {
    if (action === "remove" && !window.confirm("Remove this account permanently?")) return;
    try {
      const response = await api.post<TeamUser | undefined>(`/users/${id}/${action}/`);
      queryClient.setQueryData<TeamUser[]>(queryKeys.team, (current = []) => {
        if (action === "remove") return current.filter((user) => user.id !== id);
        if (!response.data) return current;
        return current.map((user) => user.id === id ? response.data as TeamUser : user);
      });
      announceDataChange(["team"]);
    } catch {
      window.alert("Action failed.");
    }
  };

  const pending = users.filter((u) => !u.is_active);
  const active = users.filter((u) => u.is_active);

  const row = (u: TeamUser) => (
    <tr key={u.id}>
      <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>
        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
        <div style={{ color: "var(--ink-600)", fontWeight: 400, fontSize: ".78rem" }}>@{u.username}</div>
      </td>
      <td>{u.email}</td>
      <td><span className="customer-chip" style={{ textTransform: "capitalize" }}>{u.role}</span></td>
      <td style={{ textAlign: "right" }}>
        <span style={{ display: "inline-flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!u.is_active && <button className="button button--primary button--small" onClick={() => act(u.id, "approve")}>Approve</button>}
          {u.is_active && u.role !== "admin" && <button className="button button--ghost button--small" onClick={() => act(u.id, "deactivate")}>Deactivate</button>}
          {u.role !== "admin" && <button className="button button--danger button--small" onClick={() => act(u.id, "remove")}>Remove</button>}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="page-container">
      <PageHeader eyebrow="Team" title="Team" description="Approve new sellers and manage who can access the app." />

      {loading ? (
        <div className="surface empty-state"><strong>Loading…</strong></div>
      ) : (
        <>
          <h3 style={{ margin: "0 0 12px", color: "var(--ink-900)" }}>
            Pending approval {pending.length > 0 && <span className="customer-chip" style={{ color: "var(--danger)" }}>{pending.length}</span>}
          </h3>
          <section className="surface list-surface" style={{ marginBottom: "22px" }}>
            {pending.length === 0 ? (
              <div className="empty-state"><strong>No one waiting</strong><p>New seller signups will appear here for approval.</p></div>
            ) : (
              <table className="glass-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th /></tr></thead>
                <tbody>{pending.map(row)}</tbody>
              </table>
            )}
          </section>

          <h3 style={{ margin: "0 0 12px", color: "var(--ink-900)" }}>Active members</h3>
          <section className="surface list-surface">
            <table className="glass-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th /></tr></thead>
              <tbody>{active.map(row)}</tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
};

export default TeamPage;
