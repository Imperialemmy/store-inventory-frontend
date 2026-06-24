import ListPage from "../../../shared/list_page/ListPage";

type Supplier = {
  id: number;
  name: string;
};

export default function SupplierList() {
  return (
    <ListPage<Supplier>
      title="Suppliers"
      apiEndpoint="/suppliers/"
      itemKey={(item) => item.id}
      itemNameSelector={(item) => item.name}
      navigateTo={() => "/suppliers"}
      createPath="/suppliers/add"
      createLabel="Add supplier"
    />
  );
}
