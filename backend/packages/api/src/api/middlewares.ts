import { authenticate } from "@medusajs/framework/http"
import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      // Moving a guest order into an account needs a signed-in customer.
      matcher: "/store/order-lookup/claim",
      method: ["POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      // A signed-in customer's orders, with delivery progress (src/lib/order-progress.ts).
      matcher: "/store/my-order-groups*",
      method: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
