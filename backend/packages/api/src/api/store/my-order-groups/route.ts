import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryOrderGroups, shopOrderGroup, type ShopOrderGroup } from "../../../lib/order-progress"

/**
 * GET /store/my-order-groups?limit=50&offset=0
 * The signed-in customer's orders, newest first, each vendor's part with its delivery progress
 * and tracking number. Used by the account page instead of Mercur's /store/order-groups,
 * which leaves the progress out (see src/lib/order-progress.ts).
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ order_groups: ShopOrderGroup[]; count: number; limit: number; offset: number }>
) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
  const offset = Math.max(Number(req.query.offset) || 0, 0)
  const { groups, count } = await queryOrderGroups(
    req.scope,
    { customer_id: req.auth_context.actor_id },
    { take: limit, skip: offset, order: { created_at: "DESC" } }
  )
  res.json({ order_groups: groups.map(shopOrderGroup), count, limit, offset })
}
