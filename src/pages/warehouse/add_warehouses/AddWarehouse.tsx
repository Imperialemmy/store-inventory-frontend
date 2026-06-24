import EntityCreatePage from "../../../components/ui/EntityCreatePage";

const AddWarehouse = () => (
  <EntityCreatePage
    eyebrow="Locations"
    title="New warehouse"
    description="Add a storage location so stock can be tracked per warehouse."
    endpoint="/warehouses/"
    initialValues={{ name: "", address: "" }}
    fields={[
      { name: "name", label: "Warehouse name", placeholder: "e.g. Main Store" },
      { name: "address", label: "Address", placeholder: "Location / address", required: false },
    ]}
    successMessage="Warehouse saved and ready to use."
    backTo="/warehouses"
  />
);

export default AddWarehouse;
