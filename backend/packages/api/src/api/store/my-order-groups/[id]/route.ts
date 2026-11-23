import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { queryOrderGroups, shopOrderGroup, type ShopOrderGroup } from "../../../../lib/order-progress"

/**
 * GET /store/my-order-groups/:id
 * One of the signed-in customer's orders, with each vendor's delivery progress and tracking
 * number (src/lib/order-progress.ts). Another customer's order is "not found".
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse<{ order_group: ShopOrderGroup }>) {
  const { groups } = await queryOrderGroups(req.scope, {
    id: req.params.id,
    customer_id: req.auth_context.actor_id,
  })
  if (!groups[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found.")
  }
  res.json({ order_group: shopOrderGroup(groups[0]) })
}
