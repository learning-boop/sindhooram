import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/overview   (owner panel only: every /admin route needs a signed-in admin)
 * The numbers behind the owner panel's Overview page: vendors, orders, sales, the platform's
 * commission, customers, a 30-day sales trend, the top vendors, the latest orders and the vendor
 * products waiting for approval.
 *
 * Counted in the database (fast with thousands of orders). "Today" and "this month" are in
 * India time. Cancelled and draft orders are left out. One checkout = one order (an "order
 * group" in Mercur), split into one vendor order per weaver.
 */

export type OverviewVendor = {
  id: string
  name: string
  handle: string
  status: string
  orders: number
  sales: number
  commission: number
  listings: number
}

export type OverviewOrder = {
  id: string
  display_id: number
  created_at: string
  email: string | null
  vendor_orders: number
  total: number
  sellers: string | null
  order_id: string
  has_account: boolean
}

// A product a vendor added that waits for the owner's approval (Products → Inbox).
export type OverviewPendingProduct = {
  id: string
  title: string
  thumbnail: string | null
  created_at: string
  vendor: string | null
  price: number | null // the vendor's price; null when they have not set one yet
}

export type AdminOverviewResponse = {
  currency_code: string
  commission_rate: { value: number; type: string } | null
  vendors: { total: number; open: number; pending: number; suspended: number; terminated: number }
  pending_vendors: { id: string; name: string; email: string; created_at: string }[]
  pending_products: OverviewPendingProduct[]
  orders: { all: number; month: number; today: number; vendor_orders: number }
  sales: { all: number; month: number; today: number }
  commission: { all: number; month: number; today: number }
  customers: { with_orders: number; registered: number; guests: number }
  products: { published: number; listings: number; pending: number }
  daily: { day: string; sales: number; orders: number }[]
  top_vendors: OverviewVendor[]
  recent_orders: OverviewOrder[]
}

const TZ = "Asia/Kolkata"

// Orders that count: not deleted, not drafts, not cancelled; total from the latest order summary.
const LIVE = `
  live as (
    select o.id, o.display_id, o.created_at, o.email, o.customer_id,
           coalesce((sm.totals->>'current_order_total')::numeric, 0) as total
    from "order" o
    left join lateral (
      select s.totals from order_summary s
      where s.order_id = o.id and s.deleted_at is null
      order by s.version desc limit 1
    ) sm on true
    where o.deleted_at is null and o.is_draft_order = false and o.status not in ('canceled', 'draft')
  )`

// Commission lines are written per order item (and per delivery when commission includes shipping).
const COMMISSION = `
  commission as (
    select cl.amount, oi.order_id
    from commission_line cl
    join (select distinct item_id, order_id from order_item where deleted_at is null) oi on oi.item_id = cl.item_id
    where cl.deleted_at is null and cl.item_id is not null
    union all
    select cl.amount, os.order_id
    from commission_line cl
    join (select distinct shipping_method_id, order_id from order_shipping where deleted_at is null) os
      on os.shipping_method_id = cl.shipping_method_id
    where cl.deleted_at is null and cl.shipping_method_id is not null
  )`

const BOUNDS = `
  b as (
    select date_trunc('day', now() at time zone '${TZ}') at time zone '${TZ}' as today,
           date_trunc('month', now() at time zone '${TZ}') at time zone '${TZ}' as month
  )`

const num = (v: unknown) => Number(v ?? 0) || 0

export async function GET(req: MedusaRequest, res: MedusaResponse<AdminOverviewResponse>) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const rows = async <T = Record<string, any>>(sql: string): Promise<T[]> => (await pg.raw(sql)).rows as T[]

  const [
    totals,
    vendorRows,
    pendingRows,
    customerRows,
    productRows,
    dailyRows,
    topRows,
    recentRows,
    rateRows,
    storeRows,
    pendingProductRows,
  ] = await Promise.all([
      rows(`with ${LIVE}, ${COMMISSION}, ${BOUNDS},
        groups as (
          select ogo.order_group_id, min(l.created_at) as created_at
          from order_group_order ogo join live l on l.id = ogo.order_id
          where ogo.deleted_at is null group by ogo.order_group_id
        )
        select
          (select count(*) from groups) as orders,
          (select count(*) from groups, b where created_at >= b.month) as orders_month,
          (select count(*) from groups, b where created_at >= b.today) as orders_today,
          (select count(*) from live) as vendor_orders,
          (select coalesce(sum(total), 0) from live) as sales,
          (select coalesce(sum(total), 0) from live, b where created_at >= b.month) as sales_month,
          (select coalesce(sum(total), 0) from live, b where created_at >= b.today) as sales_today,
          (select coalesce(sum(c.amount), 0) from commission c join live l on l.id = c.order_id) as commission,
          (select coalesce(sum(c.amount), 0) from commission c join live l on l.id = c.order_id, b where l.created_at >= b.month) as commission_month,
          (select coalesce(sum(c.amount), 0) from commission c join live l on l.id = c.order_id, b where l.created_at >= b.today) as commission_today`),
      rows(`select status, count(*) as n from seller where deleted_at is null group by status`),
      rows(`select id, name, email, created_at from seller
            where deleted_at is null and status = 'pending_approval' order by created_at desc limit 10`),
      rows(`with ${LIVE}
        select count(distinct l.customer_id) as with_orders,
               count(distinct l.customer_id) filter (where c.has_account) as registered,
               count(distinct l.customer_id) filter (where not coalesce(c.has_account, false)) as guests
        from live l left join customer c on c.id = l.customer_id`),
      rows(`select
          (select count(*) from product where deleted_at is null and status = 'published') as published,
          (select count(*) from product where deleted_at is null and status = 'proposed') as pending,
          (select count(*) from offer where deleted_at is null) as listings`),
      rows(`with ${LIVE}
        select to_char(l.created_at at time zone '${TZ}', 'YYYY-MM-DD') as day,
               coalesce(sum(l.total), 0) as sales, count(*) as orders
        from live l
        where l.created_at >= (date_trunc('day', now() at time zone '${TZ}') - interval '29 days') at time zone '${TZ}'
        group by 1 order by 1`),
      rows(`with ${LIVE}, ${COMMISSION},
        per_order as (
          select oss.seller_id, l.id, l.total,
                 (select coalesce(sum(c.amount), 0) from commission c where c.order_id = l.id) as commission
          from live l join order_order_seller_seller oss on oss.order_id = l.id and oss.deleted_at is null
        )
        select s.id, s.name, s.handle, s.status,
               count(p.id) as orders, coalesce(sum(p.total), 0) as sales, coalesce(sum(p.commission), 0) as commission,
               (select count(*) from offer f where f.seller_id = s.id and f.deleted_at is null) as listings
        from seller s left join per_order p on p.seller_id = s.id
        where s.deleted_at is null
        group by s.id
        order by coalesce(sum(p.total), 0) desc, s.name
        limit 8`),
      rows(`with ${LIVE}
        select og.id, og.display_id, og.created_at,
               min(l.email) as email, count(l.id) as vendor_orders, coalesce(sum(l.total), 0) as total,
               string_agg(distinct s.name, ', ') as sellers, min(l.id) as order_id,
               coalesce(bool_or(c.has_account), false) as has_account
        from order_group og
        join order_group_order ogo on ogo.order_group_id = og.id and ogo.deleted_at is null
        join live l on l.id = ogo.order_id
        left join order_order_seller_seller oss on oss.order_id = l.id and oss.deleted_at is null
        left join seller s on s.id = oss.seller_id
        left join customer c on c.id = l.customer_id
        where og.deleted_at is null
        group by og.id
        order by og.created_at desc
        limit 8`),
      rows(`select value, type from commission_rate
            where deleted_at is null and is_enabled and (is_default or code = 'default')
            order by is_default desc limit 1`),
      rows(`select currency_code from store_currency where is_default and deleted_at is null limit 1`),
      // vendor (who added it, see src/lib/vendor-offer.ts) and their lowest price
      rows(`select p.id, p.title, p.thumbnail, p.created_at,
               (select s.name from product_change_action a
                  join product_change c on c.id = a.product_change_id
                  join seller s on s.id = c.created_by
                where a.product_id = p.id and a.action = 'PRODUCT_ADD' and a.deleted_at is null
                limit 1) as vendor,
               (select min(pr.amount) from offer o
                  join offer_offer_pricing_price op on op.offer_id = o.id and op.deleted_at is null
                  join price pr on pr.id = op.price_id and pr.deleted_at is null
                where o.product_id = p.id and o.deleted_at is null) as price
            from product p
            where p.deleted_at is null and p.status = 'proposed'
            order by p.created_at desc
            limit 10`),
    ])

  const t = totals[0] ?? {}
  const byStatus = Object.fromEntries(vendorRows.map((r) => [r.status, num(r.n)]))

  // a bar for each of the last 30 days, including days without orders
  const dailyMap = new Map(dailyRows.map((r) => [r.day, r]))
  const daily: AdminOverviewResponse["daily"] = []
  const todayIst = new Date(Date.now() + 5.5 * 3600 * 1000)
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayIst)
    d.setUTCDate(d.getUTCDate() - i)
    const day = d.toISOString().slice(0, 10)
    const r = dailyMap.get(day)
    daily.push({ day, sales: num(r?.sales), orders: num(r?.orders) })
  }

  res.json({
    currency_code: storeRows[0]?.currency_code || "inr",
    commission_rate: rateRows[0] ? { value: num(rateRows[0].value), type: rateRows[0].type } : null,
    vendors: {
      total: vendorRows.reduce((s, r) => s + num(r.n), 0),
      open: byStatus.open ?? 0,
      pending: byStatus.pending_approval ?? 0,
      suspended: byStatus.suspended ?? 0,
      terminated: byStatus.terminated ?? 0,
    },
    pending_vendors: pendingRows.map((r) => ({ id: r.id, name: r.name, email: r.email, created_at: r.created_at })),
    pending_products: pendingProductRows.map((r) => ({
      id: r.id,
      title: r.title,
      thumbnail: r.thumbnail ?? null,
      created_at: r.created_at,
      vendor: r.vendor ?? null,
      price: r.price === null || r.price === undefined ? null : num(r.price),
    })),
    orders: {
      all: num(t.orders),
      month: num(t.orders_month),
      today: num(t.orders_today),
      vendor_orders: num(t.vendor_orders),
    },
    sales: { all: num(t.sales), month: num(t.sales_month), today: num(t.sales_today) },
    commission: { all: num(t.commission), month: num(t.commission_month), today: num(t.commission_today) },
    customers: {
      with_orders: num(customerRows[0]?.with_orders),
      registered: num(customerRows[0]?.registered),
      guests: num(customerRows[0]?.guests),
    },
    products: {
      published: num(productRows[0]?.published),
      listings: num(productRows[0]?.listings),
      pending: num(productRows[0]?.pending),
    },
    daily,
    top_vendors: topRows.map((r) => ({
      id: r.id,
      name: r.name,
      handle: r.handle,
      status: r.status,
      orders: num(r.orders),
      sales: num(r.sales),
      commission: num(r.commission),
      listings: num(r.listings),
    })),
    recent_orders: recentRows.map((r) => ({
      id: r.id,
      display_id: num(r.display_id),
      created_at: r.created_at,
      email: r.email,
      vendor_orders: num(r.vendor_orders),
      total: num(r.total),
      sellers: r.sellers,
      order_id: r.order_id,
      has_account: Boolean(r.has_account),
    })),
  })
}
