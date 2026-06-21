import EntityCreatePage from "../../../components/ui/EntityCreatePage";

const AddCategory = () => (
  <EntityCreatePage
    eyebrow="Product taxonomy"
    title="New category"
    description="Create a clear shelf group so products stay easy to find."
    endpoint="/categories/"
    initialValues={{ name: "" }}
    fields={[{ name: "name", label: "Category name", placeholder: "e.g. Grains and flour" }]}
    successMessage="Category saved and ready to use."
    backTo="/categories"
  />
);

export default AddCategory;
