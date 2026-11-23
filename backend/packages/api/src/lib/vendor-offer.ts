/**
 * A vendor's price and stock for a product.
 *
 * In Mercur a product is a catalogue entry; what a vendor actually sells is an "offer": their
 * price, stock and SKU for each variant. The shop only shows products that are published AND
 * have an offer with a price. The vendor panel's "Add product" form asks for the price and stock
 * (apps/vendor/src/custom-fields/product.tsx); the code here turns them into offers:
 *   - right after the product is created  (src/workflows/hooks/vendor-product-price.ts)
 *   - from the product page, for products added before that  (src/api/vendor/product-pricing)
 *
 * A vendor without a warehouse yet (a newly registered one) gets one set up here, with the same
 * delivery options as the demo vendors: Standard (free) and Express (₹250), all over India.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createLocationFulfillmentSetWorkflow,
  createServiceZonesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  createOffersWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
} from "@mercurjs/core/workflows"
import { ProductChangeActionType, type CreateOfferDTO } from "@mercurjs/types"

const CURRENCY = "inr"
const MAX_PRICE = 10_000_000 // ₹1 crore: anything above is a typo

/* ---------- reading what the vendor typed ---------- */

/** "1,299", "₹ 1299" or 1299 → 1299. Empty, zero, negative or not a number → null. */
export function readPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = typeof value === "number" ? value : Number(String(value).replace(/[₹,\s]/g, ""))
  if (!Number.isFinite(n) || n <= 0 || n > MAX_PRICE) return null
  return Math.round(n * 100) / 100
}

/** Pieces in stock: a whole number from 0. Empty → 1 (most handloom sarees are one of a kind). */
export function readStock(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return 1
  const n = typeof value === "number" ? value : Number(String(value).replace(/[,\s]/g, ""))
  if (!Number.isFinite(n) || n < 0 || n > 100_000) return null
  return Math.floor(n)
}

/* ---------- who listed the product ---------- */

/** The vendor who added this product in the vendor panel, or null (added by the owner or the demo seed). */
export async function findProductSeller(container: MedusaContainer, productId: string): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: actions } = await query.graph({
    entity: "product_change_action",
    fields: ["product_change.created_by"],
    filters: { product_id: productId, action: ProductChangeActionType.PRODUCT_ADD },
  })
  const ids = [...new Set(actions.map((a: any) => a.product_change?.created_by).filter(Boolean))] as string[]
  if (!ids.length) return null
  const { data: sellers } = await query.graph({ entity: "seller", fields: ["id"], filters: { id: ids } })
  return (sellers[0]?.id as string) ?? null
}

/** True when this vendor added the product, or the owner assigned it to them. */
export async function sellerHasProduct(container: MedusaContainer, sellerId: string, productId: string) {
  if ((await findProductSeller(container, productId)) === sellerId) return true
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: { seller_id: sellerId, product_id: productId },
  })
  return links.length > 0
}

/* ---------- what the vendor sees on the product page ---------- */

export type VendorPricing = {
  product: { id: string; title: string; status: string }
  offers: { id: string; sku: string; variant: string; price: number | null; currency_code: string; stock: number }[]
  missing: number // variants this vendor has no price for yet
  owned: boolean // this vendor added the product (or the owner assigned it to them)
  can_set_price: boolean
}

export async function getVendorPricing(container: MedusaContainer, sellerId: string, productId: string): Promise<VendorPricing> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["id", "title", "status", "variants.id", "variants.title"],
    filters: { id: productId },
  })
  if (!product) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found.")

  const variants = (product.variants ?? []) as { id: string; title: string }[]
  const { data: offers } = variants.length
    ? await query.graph({
        entity: "offer",
        fields: [
          "id",
          "sku",
          "variant_id",
          "prices.amount",
          "prices.currency_code",
          "inventory_items.location_levels.stocked_quantity",
          "inventory_items.location_levels.reserved_quantity",
        ],
        filters: { seller_id: sellerId, variant_id: variants.map((v) => v.id) },
      })
    : { data: [] as any[] }

  const titleOf = new Map(variants.map((v) => [v.id, v.title]))
  const rows = offers.map((o: any) => {
    const price = (o.prices ?? []).find((p: any) => p.currency_code === CURRENCY) ?? o.prices?.[0]
    const levels = (o.inventory_items ?? []).flatMap((i: any) => i?.location_levels ?? [])
    const stock = levels.reduce((s: number, l: any) => s + Number(l?.stocked_quantity ?? 0) - Number(l?.reserved_quantity ?? 0), 0)
    return {
      id: o.id,
      sku: o.sku,
      variant: titleOf.get(o.variant_id) || "",
      price: price ? Number(price.amount) : null,
      currency_code: price?.currency_code || CURRENCY,
      stock: Math.max(0, stock),
    }
  })
  const missing = variants.length - new Set(offers.map((o: any) => o.variant_id)).size
  const owned = await sellerHasProduct(container, sellerId, productId)

  return {
    product: { id: product.id, title: product.title, status: product.status as string },
    offers: rows,
    missing,
    owned,
    can_set_price: owned && missing > 0 && product.status !== "rejected",
  }
}

/* ---------- creating the offers ---------- */

type CreateInput = { productId: string; sellerId: string; price: number; stock: number; createdBy?: string }

/** One offer per variant that this vendor has no price for yet. Returns how many were created. */
export async function createVendorOffers(container: MedusaContainer, input: CreateInput): Promise<number> {
  const { productId, sellerId, price, stock } = input
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "status", "variants.id", "variants.sku"],
    filters: { id: productId },
  })
  if (!product) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found.")
  if (product.status === "rejected") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This product was rejected, so it cannot be priced.")
  }
  const variants = (product.variants ?? []) as { id: string; sku: string | null }[]
  if (!variants.length) return 0

  const { data: existing } = await query.graph({
    entity: "offer",
    fields: ["variant_id"],
    filters: { seller_id: sellerId, variant_id: variants.map((v) => v.id) },
  })
  const priced = new Set(existing.map((o: any) => o.variant_id))
  const todo = variants.filter((v) => !priced.has(v.id))
  if (!todo.length) return 0

  const { locationId, shippingProfileId } = await ensureSellerDelivery(container, sellerId)
  const createdBy = input.createdBy || (await ownerMemberId(container, sellerId)) || sellerId
  const skus = await freeSkus(container, product.handle || product.id, variants, todo)

  const offers: CreateOfferDTO[] = todo.map((v) => {
    const sku = skus.get(v.id)!
    return {
      seller_id: sellerId,
      created_by: createdBy,
      sku,
      variant_id: v.id,
      shipping_profile_id: shippingProfileId,
      inventory_items: [{ sku, stock_levels: [{ location_id: locationId, stocked_quantity: stock }] }],
      prices: [{ amount: price, currency_code: CURRENCY }],
    } as CreateOfferDTO
  })
  await createOffersWorkflow(container).run({ input: { offers } })
  return offers.length
}

/* SKUs must be unique across the whole shop. Uses the variant's own SKU when the vendor typed
   one, otherwise SH-<HANDLE>(-2, -3 … for more variants), with a suffix if already taken. */
async function freeSkus(
  container: MedusaContainer,
  handle: string,
  all: { id: string; sku: string | null }[],
  todo: { id: string; sku: string | null }[]
) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const base = `SH-${handle.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "ITEM"}`
  const wanted = todo.map((v) => {
    const own = v.sku?.trim()
    if (own) return own
    return all.length > 1 ? `${base}-${all.findIndex((a) => a.id === v.id) + 1}` : base
  })
  const { rows } = await pg.raw(
    `select sku from inventory_item where deleted_at is null and sku = any(?)
     union select sku from offer where deleted_at is null and sku = any(?)
     union select sku from inventory_item where deleted_at is null and sku like ?`,
    [wanted, wanted, `${base}%`]
  )
  const taken = new Set((rows as { sku: string }[]).map((r) => r.sku))
  const out = new Map<string, string>()
  todo.forEach((v, i) => {
    let sku = wanted[i]
    for (let n = 2; taken.has(sku); n++) sku = `${wanted[i]}-${n}`
    taken.add(sku)
    out.set(v.id, sku)
  })
  return out
}

async function ownerMemberId(container: MedusaContainer, sellerId: string): Promise<string | null> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { rows } = await pg.raw(
    `select member_id from seller_member where seller_id = ? and deleted_at is null
     order by is_owner desc, created_at asc limit 1`,
    [sellerId]
  )
  return rows[0]?.member_id ?? null
}

/* ---------- where the vendor ships from ---------- */

/** The vendor's warehouse and the delivery profile its offers use; sets them up if missing. */
export async function ensureSellerDelivery(container: MedusaContainer, sellerId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const shippingProfileId = await sellerShippingProfile(container, sellerId)

  const { data: locations } = await query.graph({
    entity: "stock_location_seller",
    fields: ["stock_location_id"],
    filters: { seller_id: sellerId },
  })
  const existing = locations[0]?.stock_location_id as string | undefined
  const locationId = existing ?? (await setUpSellerDelivery(container, sellerId, shippingProfileId))
  return { locationId, shippingProfileId }
}

async function sellerShippingProfile(container: MedusaContainer, sellerId: string): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: links } = await query.graph({
    entity: "shipping_option_seller",
    fields: ["shipping_option_id"],
    filters: { seller_id: sellerId },
  })
  const optionIds = links.map((l: any) => l.shipping_option_id).filter(Boolean)
  if (optionIds.length) {
    const { data: options } = await query.graph({
      entity: "shipping_option",
      fields: ["shipping_profile_id"],
      filters: { id: optionIds },
    })
    const id = options.find((o: any) => o.shipping_profile_id)?.shipping_profile_id
    if (id) return id
  }
  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id", "name", "type"] })
  const profile =
    profiles.find((p: any) => p.name === "Marketplace Shipping") ?? profiles.find((p: any) => p.type === "default") ?? profiles[0]
  if (!profile) throw new MedusaError(MedusaError.Types.NOT_FOUND, "No shipping profile exists yet.")
  return profile.id
}

/* A new vendor's warehouse (their registered address), linked to the shop's sales channel, with
   Standard and Express delivery across India. Same set-up as the demo vendors in the seed. */
async function setUpSellerDelivery(container: MedusaContainer, sellerId: string, shippingProfileId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const {
    data: [seller],
  } = await query.graph({ entity: "seller", fields: ["id", "name", "address.*"], filters: { id: sellerId } })
  const name = (seller?.name as string) || "Vendor"
  const a = ((seller as any)?.address ?? {}) as Record<string, string | null>
  logger.info(`Setting up a warehouse and delivery options for vendor "${name}".`)

  const {
    result: [location],
  } = await createSellerStockLocationsWorkflow(container).run({
    input: {
      seller_id: sellerId,
      locations: [
        {
          name: `${name} Warehouse`,
          address: {
            address_1: a.address_1 || name,
            address_2: a.address_2 || undefined,
            city: a.city || undefined,
            province: a.province || undefined,
            postal_code: a.postal_code || undefined,
            phone: a.phone || undefined,
            country_code: (a.country_code || "in").toLowerCase(),
          },
        },
      ],
    },
  })

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  const {
    data: [store],
  } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
  if (store?.default_sales_channel_id) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: location.id, add: [store.default_sales_channel_id] },
    })
  }

  await createLocationFulfillmentSetWorkflow(container).run({
    input: { location_id: location.id, fulfillment_set_data: { name: `${name} delivery (${location.id.slice(-6)})`, type: "shipping" } },
  })
  const {
    data: [withSet],
  } = await query.graph({ entity: "stock_location", fields: ["fulfillment_sets.id"], filters: { id: location.id } })
  const fulfillmentSetId = (withSet as any)?.fulfillment_sets?.[0]?.id as string

  const { result: zones } = await createServiceZonesWorkflow(container).run({
    input: {
      data: [
        {
          fulfillment_set_id: fulfillmentSetId,
          name: `${name} India`,
          geo_zones: [{ country_code: "in", type: "country" as const }],
        },
      ],
    },
  })

  const { data: regions } = await query.graph({ entity: "region", fields: ["id"], filters: { currency_code: CURRENCY } })
  const regionPrices = (amount: number) => [
    { currency_code: CURRENCY, amount },
    ...regions.map((r: any) => ({ region_id: r.id as string, amount })),
  ]
  const rules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]
  await createSellerShippingOptionsWorkflow(container).run({
    input: {
      seller_id: sellerId,
      shipping_options: [
        {
          name: "Standard Delivery",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: zones[0].id,
          shipping_profile_id: shippingProfileId,
          type: { label: "Standard", description: "Free, delivered in 5–7 days.", code: "standard" },
          prices: regionPrices(0),
          rules,
        },
        {
          name: "Express Delivery",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: zones[0].id,
          shipping_profile_id: shippingProfileId,
          type: { label: "Express", description: "Delivered in 2–3 days.", code: "express" },
          prices: regionPrices(250),
          rules,
        },
      ],
    },
  } as any)

  return location.id as string
}
