// Re-export shim so legacy imports keep working.
// All data now lives in the database; use server functions in catalog.functions.ts.
export { inr, type Product } from "./catalog-types";
