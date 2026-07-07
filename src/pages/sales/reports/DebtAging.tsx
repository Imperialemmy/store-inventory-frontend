import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { formatNaira } from "../salesTypes";

interface AgingRow {
  customer: number;
  customer_name: string;
  "0_30": string;
  "31_60": string;
  "61_90": string;
  over_90: string;
  total: string;
}

const cell = (value: string, danger = false) => (
  <td style={{ textAlign: "right", fontWeight: Number(value) > 0 ? 700 : 400, color: Number(value) > 0 && danger ? "var(--danger)" : undefined }}>
    {Number(value) > 0 ? formatNaira(value) : "—"}
  </td>
);

const DebtAging = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AgingRow[]>([]);
  const [asOf, setAsOf] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/customers/debt-aging/")
      .then((res) => {
        setRows(res.data.results ?? []);
        setAsOf(res.data.as_of ?? "");
      })
      .catch((err) => console.error("Debt aging failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const grand = rows.reduce((sum, r) => sum + Number(r.total), 0);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Reports"
        title="Debt aging"
        description={`Who owes what, by how long it has been outstanding${asOf ? ` — as of ${asOf}` : ""}.`}
      />

      <section className="surface list-surface">
        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <strong>No outstanding debt</strong>
            <p>Every invoice is fully settled.</p>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th style={{ textAlign: "right" }}>0–30 days</th>
                <th style={{ textAlign: "right" }}>31–60 days</th>
                <th style={{ textAlign: "right" }}>61–90 days</th>
                <th style={{ textAlign: "right" }}>90+ days</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.customer} style={{ cursor: "pointer" }} onClick={() => navigate(`/customers/${row.customer}`)}>
                  <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>{row.customer_name}</td>
                  {cell(row["0_30"])}
                  {cell(row["31_60"])}
                  {cell(row["61_90"], true)}
                  {cell(row.over_90, true)}
                  <td style={{ textAlign: "right", fontWeight: 800, color: "var(--ink-900)" }}>{formatNaira(row.total)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ fontWeight: 800 }}>Total</td>
                <td /><td /><td /><td />
                <td style={{ textAlign: "right", fontWeight: 800, color: "var(--danger)" }}>{formatNaira(grand)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default DebtAging;
