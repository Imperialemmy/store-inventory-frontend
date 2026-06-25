import ListPage from "../../../shared/list_page/ListPage";
import { type ExpenseCategory } from "../expenseTypes";

export default function ExpenseCategoryList() {
  return (
    <ListPage<ExpenseCategory>
      title="Expense categories"
      apiEndpoint="/expense-categories/"
      itemKey={(item) => item.id}
      itemNameSelector={(item) =>
        `${item.name}${Number(item.monthly_budget) > 0 ? ` · budget ₦${Number(item.monthly_budget).toLocaleString()}` : ""}`
      }
      navigateTo={() => "/expenses/categories"}
      createPath="/expenses/categories/add"
      createLabel="Add category"
    />
  );
}
