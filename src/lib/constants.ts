// Shared business constants — single source of truth for shipping logic.
// Used by both server functions (orders.functions.ts) and client UI (CartDrawer, checkout).
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 49;
export const MAX_QTY_PER_ITEM = 10;
export const VALID_SIZES = new Set(["S", "M", "L", "XL", "XXL"]);
