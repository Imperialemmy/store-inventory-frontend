import ListPage from "../../../shared/list_page/ListPage";

type Ware = {
  id: number;
  name: string;
};

export default function WareList() {
  return (
    <ListPage<Ware>
      title="Products"
      apiEndpoint="/wares/"
      itemKey={(item) => item.id}
      itemNameSelector={(item) => item.name}
      navigateTo={(id) => `/wares/${id}`}
    />
  );
}