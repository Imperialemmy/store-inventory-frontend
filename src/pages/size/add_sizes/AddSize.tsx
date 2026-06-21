import EntityCreatePage from "../../../components/ui/EntityCreatePage";

const AddSize = () => (
  <EntityCreatePage
    eyebrow="Packaging"
    title="New size"
    description="Define a pack size once, then reuse it across products."
    endpoint="/sizes/"
    initialValues={{ size: "", size_unit: "" }}
    fields={[
      { name: "size", label: "Amount", placeholder: "e.g. 500", type: "number" },
      { name: "size_unit", label: "Unit", placeholder: "e.g. g, kg, ml or l" },
    ]}
    successMessage="Size saved and ready to use."
    backTo="/sizes"
  />
);

export default AddSize;
