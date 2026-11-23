import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { queryOrderGroups, shopOrderGroup, type ShopOrderGroup } from "../../../lib/order-progress"

/**
 * POST /store/order-lookup
 * Order tracking without an account. The shopper gives the email they ordered with and either
 * the order number shown after checkout ("12" or "#12") or the order's id (the storefront keeps
 * that for the confirmation page). Returns the order group with one order per vendor, each with
 * its delivery progress and tracking number (src/lib/order-progress.ts).
 */

type LookupBody = { email?: string; order?: string }

const notFound = () =>
  new MedusaError(MedusaError.Types.NOT_FOUND, "We could not find an order with that number and email.")

export async function POST(
  req: MedusaRequest<LookupBody>,
  res: MedusaResponse<{ order_group: ShopOrderGroup }>
) {
  const email = String(req.body?.email ?? "").trim().toLowerCase()
  const order = String(req.body?.order ?? "").trim().replace(/^#/, "")
  if (!email || !order) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Enter your email and order number.")
  }

  let filters: Record<string, unknown>
  if (/^og_[A-Za-z0-9]+$/.test(order)) {
    filters = { id: order }
  } else if (/^\d{1,9}$/.test(order)) {
    filters = { display_id: Number(order) }
  } else {
    throw notFound()
  }

  const { groups } = await queryOrderGroups(req.scope, filters)
  const group = groups[0]
  if (!group || !(group.orders ?? []).some((o) => String(o.email ?? "").toLowerCase() === email)) {
    throw notFound()
  }

  res.json({ order_group: shopOrderGroup(group) })
}
