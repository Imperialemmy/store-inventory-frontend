export const QUANTITY_STEP = 0.25;

const QUARTERS_PER_UNIT = 1 / QUANTITY_STEP;
const EPSILON = 1e-9;

export const isQuarterQuantity = (value: number, allowZero = false) =>
  Number.isFinite(value)
  && (allowZero ? value >= 0 : value > 0)
  && Math.abs(value * QUARTERS_PER_UNIT - Math.round(value * QUARTERS_PER_UNIT)) < EPSILON;

export const snapQuarterQuantity = (value: number) =>
  Math.round(value * QUARTERS_PER_UNIT) / QUARTERS_PER_UNIT;

export const maxSellableQuantity = (stock: number) =>
  Math.max(0, Math.floor((Number(stock) + EPSILON) * QUARTERS_PER_UNIT) / QUARTERS_PER_UNIT);

export const clampQuarterQuantity = (value: number, stock: number) => {
  const maximum = maxSellableQuantity(stock);
  if (maximum < QUANTITY_STEP) return 0;
  const candidate = Number.isFinite(value) ? snapQuarterQuantity(value) : QUANTITY_STEP;
  return Math.max(QUANTITY_STEP, Math.min(maximum, candidate));
};

export const formatQuantity = (value: number | string) => {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return "0";
  return quantity.toFixed(4).replace(/\.?0+$/, "");
};
