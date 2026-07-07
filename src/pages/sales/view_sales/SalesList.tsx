import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import GenericList from "../../../shared/list_page/GenericList";
import { type Sale, formatNaira, statusLabel } from "../salesTypes";

const statusColor: Record<string, string> = {
  paid: "var(--leaf-650)",
  partial: "var(--mango-500)",
  pending: "var(--tomato-500)",
};

const SalesList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api
      .get("/sales/?page_size=100")
      .then((res) => setSales(res.data.results || res.data))
      .catch((err) => console.error("Error fetching sales:", err));
  }, []);

  return (
    <GenericList<Sale>
      title="Sales"
      eyebrow="Invoices"
      description="Wholesale and retail sales, their totals and outstanding balances."
      createPath="/sales"
      createLabel="New sale"
      items={sales}
      itemKey={(item) => item.id}
      enableSelection={false}
      onItemClick={(id) => navigate(`/sales/${id}`)}
      renderItem={(item) => (
        <div className="inventory-list__content">
          <div className="inventory-list__name">
            <span>{item.invoice_number}</span>
            <span className="customer-chip">{item.customer_name}</span>
            <span style={{ color: statusColor[item.payment_status], fontWeight: 750, fontSize: ".78rem" }}>
              {statusLabel(item.payment_status)}
            </span>
          </div>
          <span className="inventory-list__open">
            {formatNaira(item.total)}
            {Number(item.balance) > 0 ? ` · ${formatNaira(item.balance)} due` : ""}
          </span>
        </div>
      )}
    />
  );
};

export default SalesList;
