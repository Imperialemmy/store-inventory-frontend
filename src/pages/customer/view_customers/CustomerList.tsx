import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import GenericList from "../../../shared/list_page/GenericList";
import BulkSelectToolbar from "../../../features/bulk_select/BulkSelectToolbar";
import { useUserRole } from "../../../hooks/useUserRole";
import { type Customer, formatNaira } from "../customerTypes";

const CustomerList = () => {
  const navigate = useNavigate();
  const userRole = useUserRole();
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api
      .get("/customers/")
      .then((res) => setCustomers(res.data.results || res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  const handleDeleteSelected = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Delete selected customers?")) return;
    try {
      await api.post("/customers/bulk-delete/", { ids: selectedIds });
      setCustomers((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    } catch (err) {
      console.error("Bulk delete failed", err);
    }
  };

  return (
    <GenericList<Customer>
      title="Customers"
      eyebrow="Customer directory"
      description="Wholesale and retail customers, their credit, and outstanding balances."
      createPath={userRole.isAdmin ? "/customers/add" : undefined}
      createLabel="Add customer"
      items={customers}
      itemKey={(item) => item.id}
      enableSelection={userRole?.role === "admin"}
      onItemClick={(id) => navigate(`/customers/${id}`)}
      renderToolbar={(selectedIds, clear, toggleAll) =>
        userRole.role === "admin" && (
          <BulkSelectToolbar
            items={customers}
            selectedIds={selectedIds as number[]}
            onToggleAll={toggleAll}
            onClearSelection={clear}
            onDeleteSelected={() => handleDeleteSelected(selectedIds as number[])}
          />
        )
      }
      renderItem={(item, isSelected, toggleSelect, selectionMode) => (
        <div className="inventory-list__content">
          <div className="inventory-list__name">
            {selectionMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={toggleSelect}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <span>{item.name}</span>
            <span className="customer-chip">{item.customer_type_display}</span>
          </div>
          <span
            className="inventory-list__open"
            style={{ color: Number(item.outstanding_balance) > 0 ? "var(--tomato-500)" : "var(--leaf-650)" }}
          >
            {Number(item.outstanding_balance) > 0
              ? `Owes ${formatNaira(item.outstanding_balance)}`
              : "Settled"}
          </span>
        </div>
      )}
    />
  );
};

export default CustomerList;
