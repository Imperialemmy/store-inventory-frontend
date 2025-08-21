import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import WaresByFilter from "../../../shared/filter/WaresFilterComponent.tsx";
import api from "../../../services/api";

const BrandDetail = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const [brandName, setBrandName] = useState("");

  useEffect(() => {
    api
      .get(`/brands/${brandId}/`)
      .then((res) => setBrandName(res.data.name))
      .catch(() => setBrandName(`Brand ${brandId}`));
  }, [brandId]);

  return (
    <WaresByFilter
      title={`Wares for ${brandName}`}
      fetchUrl={`/wares/?brand=${brandId}`} // <- no localhost
    />
  );
};

export default BrandDetail;
