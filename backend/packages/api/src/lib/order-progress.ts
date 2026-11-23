/**
 * What the shop shows a customer about their order: one order per vendor, each with how far it
 * has got (placed → packed → shipped → delivered) and the vendor's tracking number.
 *
 * Mercur's own /store/order-groups returns the order without its delivery progress (the
 * "fulfillment_status" it lists is computed only in the panels), so a customer would see
 * "Order placed" for ever. Used by /store/order-lookup (guests) and /store/my-order-groups
 * (signed-in customers).
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const ORDER_GROUP_FIELDS = [
  "id",
  "display_id",
  "seller_count",
  "total",
  "created_at",
  "orders.id",
  "orders.display_id",
  "orders.email",
  "orders.status",
  "orders.currency_code",
  "orders.total",
  "orders.subtotal",
  "orders.item_total",
  "orders.shipping_total",
  "orders.tax_total",
  "orders.shipping_address.first_name",
  "orders.shipping_address.last_name",
  "orders.shipping_address.address_1",
  "orders.shipping_address.address_2",
  "orders.shipping_address.city",
  "orders.shipping_address.province",
  "orders.shipping_address.postal_code",
  "orders.shipping_address.country_code",
  "orders.shipping_address.phone",
  "orders.seller.id",
  "orders.seller.name",
  "orders.seller.handle",
  "orders.items.id",
  "orders.items.title",
  "orders.items.thumbnail",
  "orders.items.product_title",
  "orders.items.product_handle",
  "orders.items.variant_title",
  "orders.items.quantity",
  "orders.items.unit_price",
  "orders.items.total",
  "orders.items.detail.fulfilled_quantity",
  "orders.fulfillments.id",
  "orders.fulfillments.packed_at",
  "orders.fulfillments.shipped_at",
  "orders.fulfillments.delivered_at",
  "orders.fulfillments.canceled_at",
  "orders.fulfillments.labels.tracking_number",
  "orders.fulfillments.labels.tracking_url",
]

type Fulfillment = {
  packed_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  canceled_at?: string | null
  labels?: { tracking_number?: string | null; tracking_url?: string | null }[] | null
}
type Item = { quantity?: number | string; detail?: { fulfilled_quantity?: number | string } | null } & Record<string, unknown>
type Order = {
  email?: string | null
  items?: Item[]
  fulfillments?: Fulfillment[] | null
} & Record<string, unknown>
export type OrderGroup = { orders?: Order[] } & Record<string, unknown>

export type ShopOrder = Record<string, unknown> & {
  fulfillment_status: string
  tracking: { number: string; url: string | null }[]
}
export type ShopOrderGroup = Record<string, unknown> & { orders: ShopOrder[] }

/* Same rules as Medusa's admin (getLastFulfillmentStatus): the furthest step every vendor
   parcel has reached; "partially_…" while some parcels or pieces are behind. */
export function fulfillmentStatusOf(order: Order): string {
  const all = order.fulfillments ?? []
  const live = all.filter((f) => !f.canceled_at)
  const count = { delivered: 0, shipped: 0, packed: 0 }
  for (const f of live) {
    if (f.delivered_at) count.delivered++
    else if (f.shipped_at) count.shipped++
    else count.packed++
  }
  const piecesLeft = (order.items ?? []).some(
    (i) => Number(i.detail?.fulfilled_quantity ?? i.quantity ?? 0) < Number(i.quantity ?? 0)
  )
  const whole = (n: number) => n === live.length && !piecesLeft

  if (count.delivered) return whole(count.delivered) ? "delivered" : "partially_delivered"
  if (count.shipped) return whole(count.shipped + count.delivered) ? "shipped" : "partially_shipped"
  if (count.packed) return whole(count.packed) ? "fulfilled" : "partially_fulfilled"
  if (all.length && !live.length) return "canceled"
  return "not_fulfilled"
}

/* The customer-facing copy of an order group: progress and tracking added, the email and the
   raw parcel records left out. */
export function shopOrderGroup(group: OrderGroup): ShopOrderGroup {
  const orders = (group.orders ?? []).map(({ email: _email, fulfillments, items, ...rest }) => {
    const order = { fulfillments, items } as Order
    const tracking = (fulfillments ?? [])
      .filter((f) => !f.canceled_at)
      .flatMap((f) => f.labels ?? [])
      .filter((l) => l?.tracking_number)
      .map((l) => ({ number: String(l.tracking_number), url: l.tracking_url || null }))
    return {
      ...rest,
      items: (items ?? []).map(({ detail: _detail, ...item }) => item),
      fulfillment_status: fulfillmentStatusOf(order),
      tracking: tracking.filter((t, i) => tracking.findIndex((x) => x.number === t.number) === i),
    }
  })
  return { ...group, orders }
}

export async function queryOrderGroups(
  container: MedusaContainer,
  filters: Record<string, unknown>,
  pagination?: { take?: number; skip?: number; order?: Record<string, "ASC" | "DESC"> }
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "order_group",
    fields: ORDER_GROUP_FIELDS,
    filters,
    ...(pagination ? { pagination } : {}),
  })
  return { groups: data as OrderGroup[], count: (metadata as { count?: number } | undefined)?.count ?? data.length }
}
