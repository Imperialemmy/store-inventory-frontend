import ListPage from "../../../shared/list_page/ListPage";

type Warehouse = {
  id: number;
  name: string;
};

export default function WarehouseList() {
  return (
    <ListPage<Warehouse>
      title="Warehouses"
      apiEndpoint="/warehouses/"
      itemKey={(item) => item.id}
      itemNameSelector={(item) => item.name}
      navigateTo={() => "/warehouses"}
      createPath="/warehouses/add"
      createLabel="Add warehouse"
    />
  );
}
