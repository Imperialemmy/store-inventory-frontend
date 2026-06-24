import EntityCreatePage from "../../../components/ui/EntityCreatePage";

const AddSupplier = () => (
  <EntityCreatePage
    eyebrow="Supply chain"
    title="New supplier"
    description="Record a vendor you receive stock from, including their typical lead time."
    endpoint="/suppliers/"
    initialValues={{
      name: "",
      contact_name: "",
      phone_number: "",
      email: "",
      lead_time_days: "",
      address: "",
    }}
    fields={[
      { name: "name", label: "Supplier name", placeholder: "e.g. Dangote Distributors" },
      { name: "contact_name", label: "Contact person", placeholder: "e.g. Musa Bello", required: false },
      { name: "phone_number", label: "Phone", placeholder: "e.g. 0803 000 0000", required: false },
      { name: "email", label: "Email", placeholder: "e.g. sales@vendor.com", required: false },
      { name: "lead_time_days", label: "Lead time (days)", placeholder: "e.g. 3", type: "number", required: false },
      { name: "address", label: "Address", placeholder: "Pickup / delivery address", required: false },
    ]}
    successMessage="Supplier saved and ready to use."
    backTo="/suppliers"
  />
);

export default AddSupplier;
