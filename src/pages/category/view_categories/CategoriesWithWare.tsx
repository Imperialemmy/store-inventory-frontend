import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import WaresByFilter from "../../../shared/filter/WaresFilterComponent.tsx";
import api from "../../../services/api";

const CategoryDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    api
      .get(`/categories/${categoryId}/`)
      .then((res) => setCategoryName(res.data.name))
      .catch(() => setCategoryName(`Category ${categoryId}`));
  }, [categoryId]);

  return (
    <WaresByFilter
      title={`Wares in ${categoryName}`}
      fetchUrl={`/wares/?category=${categoryId}`}
    />
  );
};

export default CategoryDetail;
