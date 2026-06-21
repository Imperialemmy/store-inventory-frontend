import EntityCreatePage from "../../../components/ui/EntityCreatePage";

const AddBrand = () => (
  <EntityCreatePage
    eyebrow="Product taxonomy"
    title="New brand"
    description="Add the manufacturer name customers and staff already recognize."
    endpoint="/brands/"
    initialValues={{ name: "" }}
    fields={[{ name: "name", label: "Brand name", placeholder: "e.g. Golden Penny" }]}
    successMessage="Brand saved and ready to use."
    backTo="/brands"
  />
);

export default AddBrand;
