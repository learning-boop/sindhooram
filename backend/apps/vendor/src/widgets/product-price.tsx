import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Button, Container, Heading, Input, Label, StatusBadge, Text, toast } from "@medusajs/ui"
import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import { client } from "../lib/client"

/* "Price & stock" box at the top of the product page's side column (vendor panel).
   Shows whether the product is waiting for the owner's approval or live on the website, with the
   vendor's price and stock. A product without a price yet (added before the Add product form
   asked for one) gets a small form to set it.
   Data: /vendor/product-pricing/:id (packages/api/src/api/vendor/product-pricing/[id]/route.ts). */

export const config = defineWidgetConfig({
  zone: "product.detail.side.before",
})

type Pricing = Awaited<ReturnType<typeof client.vendor.productPricing.$id.query>>

const STATUS: Record<string, { label: string; color: "green" | "orange" | "red" | "grey" }> = {
  proposed: { label: "Waiting for approval", color: "orange" },
  published: { label: "Live on the website", color: "green" },
  draft: { label: "Draft", color: "grey" },
  rejected: { label: "Rejected", color: "red" },
}

const money = (n: number | null, currency = "inr") =>
  n === null
    ? "No price"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(n)

const pieces = (n: number) => `${n} ${n === 1 ? "piece" : "pieces"} in stock`

export default function ProductPriceWidget({ data }: { data?: unknown }) {
  const id = (data as { id?: string } | undefined)?.id
  const [pricing, setPricing] = useState<Pricing | null>(null)
  const [loadError, setLoadError] = useState("")

  const load = useCallback(async () => {
    if (!id) return
    try {
      setPricing(await client.vendor.productPricing.$id.query({ $id: id }))
      setLoadError("")
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load the price.")
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (!id) return null

  const status = pricing?.product.status ?? ""
  const hasPrice = !!pricing?.offers.some((o) => o.price !== null)
  const inStock = !!pricing?.offers.some((o) => o.stock > 0)
  const badge =
    status === "published" && !hasPrice ? { label: "Not on the website", color: "orange" as const } : STATUS[status]

  let note = ""
  if (pricing) {
    if (status === "proposed") {
      note = hasPrice
        ? "The owner checks new products before they go on the website. It will appear with this price once approved."
        : "The owner checks new products before they go on the website. Add your price so it can go live once approved."
    } else if (status === "published") {
      note = !hasPrice
        ? pricing.owned
          ? "Customers can't see it yet: add your price."
          : "You don't sell this product yet."
        : inStock
          ? "Customers can see and buy it."
          : "Out of stock: customers can't buy it until you add stock."
    } else if (status === "draft") {
      note = "Drafts are not on the website."
    } else if (status === "rejected") {
      note = "The owner did not approve this product."
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-x-4 px-6 py-4">
        <Heading level="h2">Price &amp; stock</Heading>
        {badge && <StatusBadge color={badge.color}>{badge.label}</StatusBadge>}
      </div>

      {loadError && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-error">{loadError}</Text>
        </div>
      )}

      {!pricing && !loadError && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">Loading…</Text>
        </div>
      )}

      {pricing && (
        <div className="flex flex-col gap-y-3 px-6 py-4">
          {note && <Text size="small" className="text-ui-fg-subtle">{note}</Text>}

          {pricing.offers.map((o) => (
            <div key={o.id} className="flex items-start justify-between gap-x-4">
              <div className="flex flex-col">
                <Text size="small" weight="plus">{money(o.price, o.currency_code)}</Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {pricing.offers.length > 1 && o.variant ? `${o.variant} · ` : ""}
                  {pieces(o.stock)}
                </Text>
              </div>
              {/* Mercur's offer page is keyed by product: /offers/:productId (Edit prices / Edit stock levels) */}
              <Link to={`/offers/${id}`} className="text-ui-fg-interactive txt-compact-small hover:underline">
                Change
              </Link>
            </div>
          ))}

          {!pricing.offers.length && !pricing.owned && status === "published" && (
            <Link to="/offers/create" className="text-ui-fg-interactive txt-compact-small hover:underline">
              Sell this product (add an offer)
            </Link>
          )}

          {pricing.can_set_price && (
            <SetPriceForm
              productId={id}
              partial={pricing.offers.length > 0}
              onSaved={(next) => {
                setPricing(next)
                toast.success("Price saved")
              }}
            />
          )}
        </div>
      )}
    </Container>
  )
}

function SetPriceForm({
  productId,
  partial,
  onSaved,
}: {
  productId: string
  partial: boolean
  onSaved: (pricing: Pricing) => void
}) {
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("1")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const p = Number(price.replace(/[₹,\s]/g, ""))
    if (!price.trim() || !Number.isFinite(p) || p <= 0) return setError("Enter the price in rupees (more than ₹0).")
    const s = stock.trim() === "" ? 1 : Number(stock)
    if (!Number.isInteger(s) || s < 0) return setError("Enter whole pieces (0 or more).")

    setSaving(true)
    setError("")
    try {
      onSaved(await client.vendor.productPricing.$id.mutate({ $id: productId, price: p, stock: s }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the price.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-y-3" noValidate>
      {partial && (
        <Text size="small" className="text-ui-fg-subtle">Some sizes or colours have no price yet. This sets it for all of them.</Text>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="sh-price" size="small" weight="plus">Price (₹)</Label>
          <Input
            id="sh-price"
            type="number"
            inputMode="decimal"
            min="1"
            step="any"
            placeholder="e.g. 12500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={!!error}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label htmlFor="sh-stock" size="small" weight="plus">Pieces in stock</Label>
          <Input
            id="sh-stock"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <Text size="small" className="text-ui-fg-error" role="alert">{error}</Text>
      )}
      <div className="flex justify-end">
        <Button size="small" type="submit" isLoading={saving}>Save price</Button>
      </div>
    </form>
  )
}
