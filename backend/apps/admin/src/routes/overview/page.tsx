import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { Link } from "react-router-dom"
import { Badge, Button, Container, Heading, StatusBadge, Table, Text } from "@medusajs/ui"
import { ArrowPath, ChartBar } from "@medusajs/icons"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"
import { client } from "../../lib/client"

/* The owner's home page: commission earned, sales, orders, vendors and customers at a glance,
   a 30-day sales chart, products and vendors waiting for approval, the top vendors and the
   latest orders.
   Data: GET /admin/overview (packages/api/src/api/admin/overview/route.ts). */

export const config: RouteConfig = {
  label: "Overview",
  icon: ChartBar,
  rank: 0,
}

type Overview = Awaited<ReturnType<typeof client.admin.overview.query>>
type Day = Overview["daily"][number]

const TZ = "Asia/Kolkata"

// Whole rupees stay whole (₹999); paise are shown when there are any (₹99.90 commission).
const money = (n: number, currency = "inr") => {
  const value = Math.round((n || 0) * 100) / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}
const moneyShort = (n: number, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n || 0)
const count = (n: number) => new Intl.NumberFormat("en-IN").format(n || 0)
const date = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ })
const dayLabel = (day: string, long = false) =>
  new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    ...(long ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
    timeZone: TZ,
  })

const VENDOR_STATUS: Record<string, { label: string; color: "green" | "orange" | "red" | "grey" }> = {
  open: { label: "Active", color: "green" },
  pending_approval: { label: "Waiting for approval", color: "orange" },
  suspended: { label: "Suspended", color: "red" },
  terminated: { label: "Closed", color: "grey" },
}

/* Scoped styles: Medusa's colour tokens, so light and dark mode both work. */
const CSS = `
.sh-ov{display:flex;flex-direction:column;gap:8px}
.sh-ov.is-busy .sh-ov__body{opacity:.55;transition:opacity .2s}
.sh-ov__body{display:flex;flex-direction:column;gap:8px}
.sh-ov__hero{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;padding:24px}
.sh-ov__hero-value{margin:4px 0 2px;font-size:48px;line-height:1.05;font-weight:600;letter-spacing:-.02em;color:var(--fg-base)}
.sh-ov__kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.sh-ov__tile{padding:16px 20px;display:flex;flex-direction:column;gap:2px}
.sh-ov__tile-value{margin:2px 0;font-size:26px;line-height:1.15;font-weight:600;color:var(--fg-base)}
.sh-ov__split{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:8px;align-items:start}
.sh-ov__num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.sh-ov__list{list-style:none;margin:0;padding:0}
.sh-ov__list li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 24px;border-top:1px solid var(--border-base)}
.sh-ov__facts{display:grid;grid-template-columns:1fr auto;gap:10px 16px;padding:16px 24px}
.sh-ov__prod{display:flex;align-items:center;gap:12px;min-width:0}
.sh-ov__thumb{flex:none;width:36px;height:44px;border-radius:6px;object-fit:cover;background:var(--bg-component);border:1px solid var(--border-base)}
.sh-ov a.sh-ov__link{color:var(--fg-interactive);text-decoration:none}
.sh-ov a.sh-ov__link:hover{text-decoration:underline}
.sh-chart{position:relative;padding:8px 24px 16px}
.sh-chart__plot{position:relative;height:180px;margin-left:56px;outline:none}
.sh-chart__plot:focus-visible{box-shadow:0 0 0 2px var(--fg-interactive);border-radius:4px}
.sh-chart__grid{position:absolute;left:0;right:0;height:1px;background:var(--border-base)}
.sh-chart__tick{position:absolute;left:-56px;width:48px;transform:translateY(-50%);text-align:right;font-size:11px;color:var(--fg-muted);font-variant-numeric:tabular-nums}
.sh-chart__cols{position:absolute;inset:0;display:flex;align-items:flex-end;gap:2px}
.sh-chart__col{flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;cursor:default}
.sh-chart__bar{width:62%;max-width:24px;min-width:3px;border-radius:4px 4px 0 0;background:#3b82f6;transition:filter .15s}
.dark .sh-chart__bar{background:#4b8df8}
.sh-chart__col.is-active .sh-chart__bar{filter:brightness(1.18)}
.sh-chart__col.is-active{background:var(--bg-base-hover);border-radius:4px 4px 0 0}
.sh-chart__x{position:relative;height:20px;margin-left:56px;font-size:11px;color:var(--fg-muted)}
.sh-chart__x span{position:absolute;top:6px;transform:translateX(-50%);white-space:nowrap}
.sh-chart__tip{position:absolute;bottom:calc(100% + 6px);transform:translateX(-50%);padding:6px 10px;border-radius:8px;background:var(--bg-base);box-shadow:var(--elevation-tooltip,0 2px 8px rgba(0,0,0,.18));pointer-events:none;white-space:nowrap;z-index:2}
.sh-chart__tip b{display:block;font-size:13px;color:var(--fg-base)}
.sh-chart__tip span{font-size:12px;color:var(--fg-subtle)}
.sh-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:1100px){.sh-ov__kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.sh-ov__split{grid-template-columns:1fr}}
`

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(true)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      setData(await client.admin.overview.query())
      setError("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the overview.")
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const cur = data?.currency_code || "inr"
  const rate = data?.commission_rate
  const rateText = rate ? (rate.type === "percentage" ? `${rate.value}% of every sale` : `${money(rate.value, cur)} per sale`) : ""

  return (
    <div className={`sh-ov${busy && data ? " is-busy" : ""}`}>
      <style>{CSS}</style>

      <Container className="p-0">
        <div className="sh-ov__hero">
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">Commission earned this month</Text>
            <p className="sh-ov__hero-value">{data ? money(data.commission.month, cur) : "—"}</p>
            <Text size="small" className="text-ui-fg-subtle">
              {data
                ? `${rateText ? `${rateText} · ` : ""}${money(data.commission.today, cur)} today · ${money(data.commission.all, cur)} all time`
                : busy ? "Loading…" : ""}
            </Text>
          </div>
          <Button variant="secondary" size="small" onClick={() => void load()} isLoading={busy && !!data}>
            <ArrowPath /> Refresh
          </Button>
        </div>
      </Container>

      {error && (
        <Container className="px-6 py-4">
          <Text className="text-ui-fg-error">{error}</Text>
        </Container>
      )}

      {data && (
        <div className="sh-ov__body">
          <div className="sh-ov__kpis">
            <Tile
              label="Sales this month"
              value={money(data.sales.month, cur)}
              lines={[`${money(data.sales.today, cur)} today`, `${money(data.sales.all, cur)} all time`]}
            />
            <Tile
              label="Orders this month"
              value={count(data.orders.month)}
              lines={[
                `${count(data.orders.today)} today · ${count(data.orders.all)} all time`,
                `${count(data.orders.vendor_orders)} vendor orders (one per weaver)`,
              ]}
              to="/orders"
            />
            <Tile
              label="Active vendors"
              value={count(data.vendors.open)}
              lines={[
                `${count(data.vendors.pending)} waiting for approval`,
                `${count(data.vendors.suspended)} suspended · ${count(data.vendors.total)} in total`,
              ]}
              to="/stores"
            />
            <Tile
              label="Customers who ordered"
              value={count(data.customers.with_orders)}
              lines={[`${count(data.customers.registered)} with an account`, `${count(data.customers.guests)} guest checkouts`]}
              to="/customers"
            />
          </div>

          <SalesChart days={data.daily} currency={cur} />

          <PendingProducts products={data.pending_products} total={data.products.pending} currency={cur} />

          <div className="sh-ov__split">
            <TopVendors vendors={data.top_vendors} currency={cur} />
            <div className="sh-ov">
              <Container className="p-0">
                <div className="px-6 py-4">
                  <Heading level="h2">Vendors waiting for approval</Heading>
                  <Text size="small" className="text-ui-fg-subtle">New vendors can sell once you approve them in Stores.</Text>
                </div>
                {data.pending_vendors.length ? (
                  <ul className="sh-ov__list">
                    {data.pending_vendors.map((v) => (
                      <li key={v.id}>
                        <div>
                          <Text size="small" weight="plus">{v.name}</Text>
                          <Text size="xsmall" className="text-ui-fg-subtle">{v.email} · {date(v.created_at)}</Text>
                        </div>
                        <Link className="sh-ov__link" to={`/stores/${v.id}`}><Text size="small">Review</Text></Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text size="small" className="text-ui-fg-subtle px-6 pb-4">No vendors are waiting for approval.</Text>
                )}
              </Container>
              <Container className="p-0">
                <div className="px-6 pt-4">
                  <Heading level="h2">Catalogue</Heading>
                </div>
                <div className="sh-ov__facts">
                  <Text size="small" className="text-ui-fg-subtle">Published products</Text>
                  <Text size="small" weight="plus" className="sh-ov__num">{count(data.products.published)}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Products waiting for approval</Text>
                  <Text size="small" weight="plus" className="sh-ov__num">{count(data.products.pending)}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Vendor listings (offers)</Text>
                  <Text size="small" weight="plus" className="sh-ov__num">{count(data.products.listings)}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Average order</Text>
                  <Text size="small" weight="plus" className="sh-ov__num">
                    {data.orders.all ? money(data.sales.all / data.orders.all, cur) : "—"}
                  </Text>
                </div>
              </Container>
            </div>
          </div>

          <RecentOrders orders={data.recent_orders} currency={cur} />
        </div>
      )}
    </div>
  )
}

/* Products vendors added that are not on the website until the owner approves them
   (Products → Inbox). Hidden when there are none. */
function PendingProducts({
  products,
  total,
  currency,
}: {
  products: Overview["pending_products"]
  total: number
  currency: string
}) {
  if (!products.length) return null
  return (
    <Container className="p-0">
      <div className="flex items-start justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">
            Products waiting for approval <Badge size="2xsmall" color="orange">{count(total)}</Badge>
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Vendors' new products appear on the website only after you approve them.
          </Text>
        </div>
        <Link className="sh-ov__link" to="/products/inbox"><Text size="small">Review in Inbox</Text></Link>
      </div>
      <ul className="sh-ov__list">
        {products.map((p) => (
          <li key={p.id}>
            <div className="sh-ov__prod">
              {p.thumbnail ? <img className="sh-ov__thumb" src={p.thumbnail} alt="" loading="lazy" /> : <span className="sh-ov__thumb" />}
              <div>
                <Text size="small" weight="plus">{p.title}</Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {p.vendor || "Vendor"} · {p.price === null ? "no price yet" : money(p.price, currency)} · {date(p.created_at)}
                </Text>
              </div>
            </div>
            <Link className="sh-ov__link" to={`/products/${p.id}`}><Text size="small">Open</Text></Link>
          </li>
        ))}
      </ul>
    </Container>
  )
}

function Tile({ label, value, lines, to }: { label: string; value: string; lines: string[]; to?: string }) {
  return (
    <Container className="sh-ov__tile">
      <Text size="small" weight="plus" className="text-ui-fg-subtle">
        {to ? <Link className="sh-ov__link" style={{ color: "inherit" }} to={to}>{label}</Link> : label}
      </Text>
      <p className="sh-ov__tile-value">{value}</p>
      {lines.map((l) => (
        <Text key={l} size="xsmall" className="text-ui-fg-subtle">{l}</Text>
      ))}
    </Container>
  )
}

/* Sales per day, last 30 days: one series, so one colour and no legend. Hover or use the arrow
   keys for a day's figures; "View as table" lists every day. */
function SalesChart({ days, currency }: { days: Day[]; currency: string }) {
  const [active, setActive] = useState<number | null>(null)
  const [asTable, setAsTable] = useState(false)

  const total = days.reduce((s, d) => s + d.sales, 0)
  const orders = days.reduce((s, d) => s + d.orders, 0)
  const { top, ticks } = useMemo(() => niceScale(Math.max(0, ...days.map((d) => d.sales))), [days])
  const current = active !== null ? days[active] : null

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = days.length - 1
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, (active ?? last + 1) - 1),
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      Home: 0,
      End: last,
    }
    if (e.key in moves) {
      e.preventDefault()
      setActive(moves[e.key])
    } else if (e.key === "Escape") {
      setActive(null)
    }
  }

  return (
    <Container className="p-0">
      <div className="flex items-start justify-between px-6 py-4">
        <div>
          <Heading level="h2">Sales, last 30 days</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {money(total, currency)} from {count(orders)} vendor {orders === 1 ? "order" : "orders"}
          </Text>
        </div>
        <Button variant="transparent" size="small" onClick={() => setAsTable((v) => !v)}>
          {asTable ? "View as chart" : "View as table"}
        </Button>
      </div>

      {asTable ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Day</Table.HeaderCell>
              <Table.HeaderCell className="sh-ov__num">Vendor orders</Table.HeaderCell>
              <Table.HeaderCell className="sh-ov__num">Sales</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {[...days].reverse().map((d) => (
              <Table.Row key={d.day}>
                <Table.Cell>{dayLabel(d.day, true)}</Table.Cell>
                <Table.Cell className="sh-ov__num">{count(d.orders)}</Table.Cell>
                <Table.Cell className="sh-ov__num">{money(d.sales, currency)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <div className="sh-chart">
          <div
            className="sh-chart__plot"
            tabIndex={0}
            role="group"
            aria-label="Sales per day for the last 30 days. Use the left and right arrow keys to read each day."
            onKeyDown={onKey}
            onMouseLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
          >
            {ticks.map((t) => (
              <div key={t} className="sh-chart__grid" style={{ bottom: `${(t / top) * 100}%` }}>
                <span className="sh-chart__tick">{moneyShort(t, currency)}</span>
              </div>
            ))}
            <div className="sh-chart__cols">
              {days.map((d, i) => (
                <div
                  key={d.day}
                  className={`sh-chart__col${active === i ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                >
                  {d.sales > 0 && <div className="sh-chart__bar" style={{ height: `${(d.sales / top) * 100}%` }} />}
                </div>
              ))}
            </div>
            {current && active !== null && (
              <div className="sh-chart__tip" style={{ left: `${((active + 0.5) / days.length) * 100}%`, bottom: `calc(${(current.sales / top) * 100}% + 8px)` }}>
                <b>{money(current.sales, currency)}</b>
                <span>{count(current.orders)} {current.orders === 1 ? "order" : "orders"} · {dayLabel(current.day, true)}</span>
              </div>
            )}
          </div>
          <div className="sh-chart__x" aria-hidden="true">
            {days.map((d, i) =>
              i % 7 === 1 || i === days.length - 1 ? (
                <span key={d.day} style={{ left: `${((i + 0.5) / days.length) * 100}%` }}>{i === days.length - 1 ? "Today" : dayLabel(d.day)}</span>
              ) : null
            )}
          </div>
          <p className="sh-sr" aria-live="polite">
            {current ? `${dayLabel(current.day, true)}: ${money(current.sales, currency)}, ${current.orders} orders` : ""}
          </p>
        </div>
      )}
    </Container>
  )
}

/* Round the axis to clean steps: 0, 5K, 10K, 15K, 20K. */
function niceScale(max: number) {
  if (max <= 0) return { top: 1000, ticks: [0, 250, 500, 750, 1000] }
  const rough = max / 4
  const mag = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(t)
  return { top, ticks }
}

function TopVendors({ vendors, currency }: { vendors: Overview["top_vendors"]; currency: string }) {
  return (
    <Container className="p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Vendors by sales</Heading>
        <Text size="small" className="text-ui-fg-subtle">All time. Commission is what the platform keeps.</Text>
      </div>
      {vendors.length ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Vendor</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="sh-ov__num">Orders</Table.HeaderCell>
              <Table.HeaderCell className="sh-ov__num">Sales</Table.HeaderCell>
              <Table.HeaderCell className="sh-ov__num">Commission</Table.HeaderCell>
              <Table.HeaderCell className="sh-ov__num">Listings</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {vendors.map((v) => {
              const status = VENDOR_STATUS[v.status] ?? { label: v.status, color: "grey" as const }
              return (
                <Table.Row key={v.id}>
                  <Table.Cell><Link className="sh-ov__link" to={`/stores/${v.id}`}>{v.name}</Link></Table.Cell>
                  <Table.Cell><StatusBadge color={status.color}>{status.label}</StatusBadge></Table.Cell>
                  <Table.Cell className="sh-ov__num">{count(v.orders)}</Table.Cell>
                  <Table.Cell className="sh-ov__num">{money(v.sales, currency)}</Table.Cell>
                  <Table.Cell className="sh-ov__num">{money(v.commission, currency)}</Table.Cell>
                  <Table.Cell className="sh-ov__num">{count(v.listings)}</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      ) : (
        <Text size="small" className="text-ui-fg-subtle px-6 pb-4">No vendors yet.</Text>
      )}
    </Container>
  )
}

function RecentOrders({ orders, currency }: { orders: Overview["recent_orders"]; currency: string }) {
  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Latest orders</Heading>
        <Link className="sh-ov__link" to="/orders"><Text size="small">All orders</Text></Link>
      </div>
      {orders.length ? (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Vendors</Table.HeaderCell>
              <Table.HeaderCell className="sh-ov__num">Total</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orders.map((o) => (
              <Table.Row key={o.id}>
                <Table.Cell><Link className="sh-ov__link" to={`/orders/${o.order_id}`}>#{o.display_id}</Link></Table.Cell>
                <Table.Cell>{date(o.created_at)}</Table.Cell>
                <Table.Cell>
                  <span className="inline-flex items-center gap-x-2">
                    {o.email}
                    <Badge size="2xsmall" color={o.has_account ? "blue" : "grey"}>{o.has_account ? "Account" : "Guest"}</Badge>
                  </span>
                </Table.Cell>
                <Table.Cell>{o.sellers}{o.vendor_orders > 1 ? ` (${o.vendor_orders})` : ""}</Table.Cell>
                <Table.Cell className="sh-ov__num">{money(o.total, currency)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <Text size="small" className="text-ui-fg-subtle px-6 pb-4">No orders yet. They will show here as soon as customers buy.</Text>
      )}
    </Container>
  )
}
