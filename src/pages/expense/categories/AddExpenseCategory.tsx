import EntityCreatePage from "../../../components/ui/EntityCreatePage";

const AddExpenseCategory = () => (
  <EntityCreatePage
    eyebrow="Spend tracking"
    title="New expense category"
    description="Group your costs and set an optional monthly budget to track spend against."
    endpoint="/expense-categories/"
    initialValues={{ name: "", monthly_budget: "0" }}
    fields={[
      { name: "name", label: "Category name", placeholder: "e.g. Logistics" },
      { name: "monthly_budget", label: "Monthly budget (₦)", placeholder: "0", type: "number", required: false },
    ]}
    successMessage="Category saved and ready to use."
    backTo="/expenses/categories"
  />
);

export default AddExpenseCategory;
