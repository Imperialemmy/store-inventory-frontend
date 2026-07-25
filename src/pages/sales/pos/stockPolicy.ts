import type { CartLine } from "../../../offline/types";

/** Products whose final cached units must be approved by the live server. */
export const scarceOfflineProducts = (cart: CartLine[], threshold: number) =>
  cart.filter((line) => line.product.stock <= threshold);
