import { useState, useEffect } from "react";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";
import GenericList from "../../../shared/list_page/GenericList";
import BulkSelectToolbar from "../../../features/bulk_select/BulkSelectToolbar";
import Modal from "../../../features/ui/Modal"; //
import { useUserRole } from "../../../hooks/useUserRole";

interface Size {
  id: number;
  size: string;
  size_unit: string;
  wares: { id: number; name: string }[];
}

const SizeList = () => {
  const navigate = useNavigate();
  const [sizes, setSizes] = useState<Size[]>([]);
  const userRole = useUserRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalWares, setModalWares] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    api
      .get("/sizes/")
      .then((res) => {
        setSizes(res.data.results || res.data);
      })
      .catch((err) => {
        console.error("Error fetching sizes:", err);
      });
  }, []);

  const handleDeleteSelected = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Delete selected sizes?")) return;

    try {
      await api.post("/sizes/bulk-delete/", { ids: selectedIds });
      setSizes((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
    } catch (err) {
      console.error("Bulk delete failed", err);
    }
  };

  const handleItemClick = (id: string | number) => {
    const numericId = typeof id === "string" ? Number(id) : id;
    const size = sizes.find((s) => s.id === numericId);
    if (!size || size.wares.length === 0) {
      alert("No ware linked to this size.");
      return;
    }

    if (size.wares.length === 1) {
      navigate(`/wares/${size.wares[0].id}`);
    } else {
      setModalWares(size.wares);
      setModalOpen(true);
    }
  };

  return (
    <>
      <GenericList
        title="Sizes"
        items={sizes}
        itemKey={(item) => item.id}
        enableSelection={userRole?.role === "admin"}
        onItemClick={handleItemClick}
        renderToolbar={(selectedIds, clear, toggleAll) => 
          userRole.role === "admin" && (
          <BulkSelectToolbar
            items={sizes}
            selectedIds={selectedIds as number[]}
            onToggleAll={toggleAll}
            onClearSelection={clear}
            onDeleteSelected={() => handleDeleteSelected(selectedIds as number[])}
          />
        )}
        renderItem={(item, isSelected, toggleSelect, selectionMode) => (
          <div className="flex justify-between items-center p-4 border rounded-md shadow-sm bg-white hover:bg-gray-100 transition cursor-pointer">
            <div className="flex items-center space-x-2">
              {selectionMode && (
                <input
                  type="checkbox"
                  id={`size-checkbox-${item.id}`}
                  name={`size-checkbox-${item.id}`}
                  checked={isSelected}
                  onChange={toggleSelect}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <label
                htmlFor={`size-checkbox-${item.id}`}
                className="text-gray-700 cursor-pointer"
              >
                {item.size} {item.size_unit} —{" "}
                {item.wares.map((w) => w.name).join(", ")}
              </label>
            </div>
          </div>
        )}
      />

      {/* Modal */}
      <Modal
        title="Select Ware"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-2">
          {modalWares.map((ware) => (
            <button
              key={ware.id}
              onClick={() => {
                setModalOpen(false);
                navigate(`/wares/${ware.id}`);
              }}
              className="block w-full text-left px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded"
            >
              {ware.name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default SizeList;
