import ListPage from "../../../shared/list_page/ListPage";

type Category = {
  id: number;
  name: string;
};

export default function CategoryList() {
  return (
    <ListPage<Category>
      title="Categories"
      apiEndpoint="/categories/"
      itemKey={(item) => item.id}
      itemNameSelector={(item) => item.name}
      navigateTo={(id) => `/categories/${id}`}
    />
  );
}