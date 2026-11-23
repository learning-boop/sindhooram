import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

/**
 * POST /store/order-lookup/claim   (signed-in customer)
 * Moves an order placed as a guest into the customer's account, so it shows under "My orders".
 * Only when the order was placed with the same email as the account and still belongs to a guest.
 * The storefront calls this right after a shopper creates an account (or signs in) on the
 * order confirmation page, using the order id it kept from checkout.
 */

type ClaimBody = { order_group_id?: string }
type Row = Record<string, any>
// The part of Mercur's seller module used here (its order groups)
type OrderGroupService = { updateOrderGroups(data: { id: string; customer_id: string }): Promise<unknown> }

export async function POST(
  req: AuthenticatedMedusaRequest<ClaimBody>,
  res: MedusaResponse<{ claimed: boolean }>
) {
  const customerId = req.auth_context?.actor_id
  const groupId = String(req.body?.order_group_id ?? "")
  if (!customerId || !/^og_[A-Za-z0-9]+$/.test(groupId)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing order.")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const [{ data: customers }, { data: groups }] = await Promise.all([
    query.graph({ entity: "customer", fields: ["id", "email", "has_account"], filters: { id: customerId } }),
    query.graph({
      entity: "order_group",
      fields: ["id", "customer_id", "orders.id", "orders.email"],
      filters: { id: groupId },
    }),
  ])
  const customer = customers[0] as Row | undefined
  const group = groups[0] as Row | undefined
  if (!customer || !group) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found.")
  }
  if (group.customer_id === customer.id) {
    return res.json({ claimed: true })
  }

  const orders = (group.orders ?? []) as Row[]
  const accountEmail = String(customer.email).toLowerCase()
  if (!orders.length || !orders.every((o) => String(o.email ?? "").toLowerCase() === accountEmail)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This order was placed with a different email.")
  }

  if (group.customer_id) {
    const { data: owners } = await query.graph({
      entity: "customer",
      fields: ["id", "has_account"],
      filters: { id: group.customer_id },
    })
    if ((owners[0] as Row | undefined)?.has_account) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This order already belongs to an account.")
    }
  }

  await req.scope
    .resolve(Modules.ORDER)
    .updateOrders(orders.map((o) => ({ id: o.id as string, customer_id: customer.id as string })))
  await req.scope
    .resolve<OrderGroupService>(MercurModules.SELLER)
    .updateOrderGroups({ id: group.id as string, customer_id: customer.id as string })

  res.json({ claimed: true })
}
