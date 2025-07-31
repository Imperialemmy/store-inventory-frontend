import ListPage from "../../../shared/list_page/ListPage";

type Brand = {
  id: number;
  name: string;
};

export default function BrandList() {
  return (
    <ListPage<Brand>
      title="Brands"
      apiEndpoint="/brands/"
      itemKey={(item) => item.id}
      itemNameSelector={(item) => item.name}
      navigateTo={(id) => `/brands/${id}`}
    />
  );
}
