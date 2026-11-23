import { defineNavigationConfig } from "@mercurjs/dashboard-sdk"

/* Owner panel sidebar: "Overview" (src/routes/overview) on top, so it is also the page the owner
   lands on after signing in; the built-in pages are listed under "Marketplace". */
export default defineNavigationConfig({
  groups: [{ id: "marketplace", label: "Marketplace" }],
  items: [
    { id: "orders", group: "marketplace" },
    { id: "products", group: "marketplace" },
    { id: "inventory", group: "marketplace" },
    { id: "customers", group: "marketplace" },
    { id: "promotions", group: "marketplace" },
    { id: "price-lists", group: "marketplace" },
    { id: "stores", group: "marketplace" },
    { id: "payouts", group: "marketplace" },
  ],
})
