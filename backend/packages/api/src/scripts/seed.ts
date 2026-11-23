/**
 * Sindhooram marketplace seed.
 *
 * Sets up everything the demo needs in one run:
 *   - store "Sindhooram" in INR, one region "India" with the manual (test) payment provider
 *   - the platform commission: 10% on every sale (the Global Commission in the admin panel)
 *   - saree categories, collections and tags
 *   - an owner (admin) login
 *   - three approved demo vendors, each with a warehouse, delivery options and their sarees
 *
 * Product photos are served by the storefront (storefront/public/assets), so set STOREFRONT_URL
 * to the storefront's public address before seeding a deployed backend.
 *
 * Run:  npm run seed   (from backend/packages/api)
 * Safe to run twice: it stops early if the demo data already exists.
 *
 * Every run (first or not) prints the storefront key and saves it where the storefront reads it:
 * storefront/.env.local for a database on this Mac, or PUBLISHABLE_KEY_FILE in Docker.
 */
import fs from "fs"
import path from "path"
import type { ExecArgs, Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ProductStatus, type CreateOfferDTO, type CreateProductDTO } from "@mercurjs/types"
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
  updateCommissionRatesWorkflow,
} from "@mercurjs/core/workflows"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createLocationFulfillmentSetWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
  createUserAccountWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

const COMMISSION_PERCENT = Number(process.env.COMMISSION_PERCENT || 10)
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@sindhooram.com"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Sindhooram@123"
const VENDOR_PASSWORD = process.env.SEED_VENDOR_PASSWORD || "Vendor@123"
const ASSETS = `${(process.env.STOREFRONT_URL || "http://localhost:3000").replace(/\/$/, "")}/assets`
// A database on this Mac or in Docker. Anything else (Neon behind the live site) needs its own settings.
const LOCAL_DB = /@(localhost|127\.0\.0\.1|postgres)(:|\/|\?|$)/.test(process.env.DATABASE_URL || "")

const img = (path: string) => `${ASSETS}/${path}`

/* ---------- vendors ---------- */
type VendorKey = "kanchi" | "banaras" | "kalakaari"

const VENDORS: Record<
  VendorKey,
  {
    name: string
    email: string
    first_name: string
    last_name: string
    description: string
    banner: string
    address: { address_1: string; city: string; province: string; postal_code: string }
  }
> = {
  kanchi: {
    name: "Kanchi Silk House",
    email: "kanchi@example.com",
    first_name: "Meenakshi",
    last_name: "Sundaram",
    description:
      "Third-generation Kanjeevaram weavers from Kanchipuram. Pure silk, real zari, korvai borders woven on pit looms.",
    banner: img("site/arch-bridal.jpg"),
    address: { address_1: "12 Gandhi Road", city: "Kanchipuram", province: "Tamil Nadu", postal_code: "631501" },
  },
  banaras: {
    name: "Banaras Weaves",
    email: "banaras@example.com",
    first_name: "Imran",
    last_name: "Ansari",
    description:
      "Katan and brocade Banarasi silks from the lanes of Varanasi, woven in gold and silver zari.",
    banner: img("site/arch-blush.jpg"),
    address: { address_1: "Godowlia Market", city: "Varanasi", province: "Uttar Pradesh", postal_code: "221001" },
  },
  kalakaari: {
    name: "Kalakaari Studio",
    email: "kalakaari@example.com",
    first_name: "Lakshmi",
    last_name: "Devi",
    description:
      "Hand-painted and block-printed Kalamkari silks from Pedana, Andhra Pradesh, made one drape at a time.",
    banner: img("site/kalakaari-window.jpg"),
    address: { address_1: "Main Bazaar", city: "Pedana", province: "Andhra Pradesh", postal_code: "521366" },
  },
}

/* ---------- the catalogue (the same sarees the site launched with) ---------- */
type SeedProduct = {
  handle: string
  title: string
  vendor: VendorKey
  collection: string
  category: string
  tag?: string
  price: number
  compareAt?: number
  stock: number
  material: string
  images: string[]
  description: string
  details: string[]
}

const CATALOGUE: SeedProduct[] = [
  {
    handle: "rajamahal-red-banarasi", title: "Rajamahal Red Banarasi", vendor: "banaras",
    collection: "Sindoor Edit", category: "Banarasi", price: 16500, compareAt: 18900, stock: 6, material: "Katan silk",
    images: [img("site/red/sindoor-full-maroon.jpg"), img("site/red/red-silk-gaze.jpg")],
    description: "Deep maroon-red katan silk with a woven gold pallu, rich enough for a wedding and light enough to dance in.",
    details: ["Katan silk · zari pallu", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "temple-lamp-kanjeevaram", title: "Temple Lamp Kanjeevaram", vendor: "kanchi",
    collection: "Sindoor Edit", category: "Kanjeevaram", tag: "Bridal", price: 21800, stock: 4, material: "Pure silk",
    images: [img("site/red/sindoor-full-river.jpg"), img("site/red/red-river-dusk.jpg")],
    description: "Red Kanjeevaram silk with gold buttis and a broad temple border, woven for the brightest days.",
    details: ["Pure silk · real zari", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "ivory-red-pattu", title: "Ivory & Red Pattu Silk", vendor: "kanchi",
    collection: "Sindoor Edit", category: "Pattu", tag: "New", price: 15400, stock: 8, material: "Pattu silk",
    images: [img("site/red/sindoor-full-ivory.jpg"), img("site/red/red-ivory-temple.jpg")],
    description: "An ivory body with a vermillion and gold pallu, the classic pairing for a temple morning.",
    details: ["Pattu silk · zari border", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "evening-maroon-silk", title: "Evening Maroon Silk", vendor: "banaras",
    collection: "Sindoor Edit", category: "Banarasi", price: 11900, stock: 10, material: "Soft silk",
    images: [img("site/red/sindoor-full-wine.jpg")],
    description: "Wine and black soft silk with a wide copper-gold border, for lamp-lit evenings.",
    details: ["Soft silk", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "ivory-zari-kasavu", title: "Ivory Zari Kasavu Silk", vendor: "kanchi",
    collection: "Handloom", category: "Handloom", tag: "Bestseller", price: 12900, stock: 12, material: "Handloom silk",
    images: [img("site/arch-ivory.jpg"), img("site/hero-woman.jpg")],
    description: "Ivory handloom silk with a fine gold zari border, light enough for a morning puja and quiet enough for every day after.",
    details: ["Handloom silk · zari border", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "blush-rose-banarasi", title: "Blush Rose Banarasi", vendor: "banaras",
    collection: "Banarasi", category: "Banarasi", price: 14500, compareAt: 16900, stock: 7, material: "Katan silk",
    images: [img("site/arch-blush.jpg"), img("site/arch-blush-detail.jpg")],
    description: "Blush-pink katan silk scattered with gold floral buttis and finished with a woven brocade pallu.",
    details: ["Katan silk", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "vermillion-bridal-kanjeevaram", title: "Vermillion Bridal Kanjeevaram", vendor: "kanchi",
    collection: "Bridal", category: "Bridal", tag: "Bridal", price: 24500, stock: 3, material: "Pure silk",
    images: [img("site/arch-bridal.jpg"), img("site/arch-bridal-detail.jpg")],
    description: "Sindoor-red Kanjeevaram silk with a broad gold korvai border, woven for the wedding morning.",
    details: ["Pure silk · real zari", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "pearl-embroidered-silk", title: "Pearl Embroidered Silk", vendor: "banaras",
    collection: "Embroidered", category: "Embroidered", tag: "New", price: 11800, stock: 9, material: "Silk",
    images: [img("site/embroidered-window.jpg"), img("site/embroidered-window-detail.jpg")],
    description: "Cream silk with tone-on-tone and blush thread embroidery that catches the light as you move.",
    details: ["Silk · hand embroidery", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "kalakaari-hand-painted", title: "Kalakaari Hand-painted Silk", vendor: "kalakaari",
    collection: "Kalakaari", category: "Kalakaari", tag: "Handmade", price: 9800, stock: 5, material: "Silk",
    images: [img("site/kalakaari-seated.jpg"), img("site/kalakaari-seated-detail.jpg")],
    description: "Kalamkari florals painted by hand on soft silk, in madder red, rust and cream.",
    details: ["Silk · hand painted", "6.3 m including blouse piece", "Gentle hand wash"],
  },
  {
    handle: "kalakaari-rust-silk", title: "Kalakaari Rust Silk", vendor: "kalakaari",
    collection: "Kalakaari", category: "Kalakaari", price: 8900, stock: 6, material: "Silk",
    images: [img("site/kalakaari-window-woman.jpg"), img("site/kalamkari-drape-detail.jpg")],
    description: "A rust-bordered Kalamkari silk with dense floral jaal, made for slow afternoons.",
    details: ["Silk · hand painted", "6.3 m including blouse piece", "Gentle hand wash"],
  },
  {
    handle: "heirloom-kalamkari-drape", title: "Heirloom Kalamkari Drape", vendor: "kalakaari",
    collection: "Kalakaari", category: "Kalakaari", price: 10400, compareAt: 11900, stock: 4, material: "Silk",
    images: [img("site/kalamkari-drape.jpg"), img("site/kalamkari-drape-detail.jpg")],
    description: "Indigo, madder and cream paisleys painted across the whole drape, edged with a woven border.",
    details: ["Silk · hand painted", "6.3 m including blouse piece", "Gentle hand wash"],
  },
  {
    handle: "candlelight-banarasi", title: "Candlelight Ivory Banarasi", vendor: "banaras",
    collection: "Banarasi", category: "Banarasi", tag: "New", price: 15200, stock: 6, material: "Banarasi silk",
    images: [img("site/women-card-woman.jpg"), img("site/arch-ivory-detail.jpg")],
    description: "Ivory Banarasi with soft blush and gold floral weaving, made for evenings lit by diyas.",
    details: ["Banarasi silk", "6.3 m including blouse piece", "Dry clean only"],
  },
  {
    handle: "temple-pond-pattu", title: "Temple Pond Pattu", vendor: "kanchi",
    collection: "Kanjeevaram", category: "Pattu", price: 12400, stock: 8, material: "Pattu silk",
    images: [img("store/over-shoulder.jpg"), img("store/jasmine-back.jpg")],
    description: "Navy and rust pattu silk with a contrast korvai border, made for mornings at the temple.",
    details: ["Pattu silk", "6.3 m including blouse piece", "Dry clean only"],
  },
]

/* Sarees and Dresses are the two departments; the storefront uses them for the Sarees / Dresses tabs.
   The children are what vendors pick from when they list a piece. */
const CATEGORY_TREE: Record<string, { handle: string; children: string[] }> = {
  Sarees: {
    handle: "sarees",
    children: ["Kanjeevaram", "Banarasi", "Pattu", "Handloom", "Embroidered", "Kalakaari", "Bridal"],
  },
  Dresses: { handle: "dresses", children: ["Anarkalis", "Kurta Sets", "Lehengas"] },
}

const COLLECTIONS = ["Sindoor Edit", "Handloom", "Banarasi", "Bridal", "Embroidered", "Kalakaari", "Kanjeevaram"]
const TAGS = ["New", "Bridal", "Bestseller", "Handmade"]

const slug = (v: string) => v.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

const STOREFRONT_KEY_TITLE = "Sindhooram Storefront"

export default async function seedSindhooram({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await seedDemoData(container, logger)
  } finally {
    await shareStorefrontKey(container, logger)
  }
}

async function seedDemoData(container: MedusaContainer, logger: Logger) {
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeModule = container.resolve(Modules.STORE)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const authModule = container.resolve(Modules.AUTH)
  const apiKeyModule = container.resolve(Modules.API_KEY)

  // Already seeded? (the storefront key is created first, the demo vendors last)
  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: VENDORS.kanchi.email },
  })
  const existingKeys = await apiKeyModule.listApiKeys({ title: STOREFRONT_KEY_TITLE, type: "publishable" })
  if (existingSellers[0] || existingKeys[0]) {
    logger.info("Sindhooram demo data already exists. Nothing to do.")
    return
  }

  // Live site: never create logins with the default passwords written in this (public) file, and never
  // point product photos at localhost. Nothing is created until these are set on the server.
  const missing = LOCAL_DB
    ? []
    : ["SEED_ADMIN_PASSWORD", "SEED_VENDOR_PASSWORD", "STOREFRONT_URL"].filter((key) => !process.env[key])
  if (missing.length) {
    logger.warn(`Demo data NOT created yet: set ${missing.join(", ")} on the server, then deploy again.`)
    return
  }

  /* ---------- store, sales channel, region ---------- */
  logger.info("Setting up the store (INR, India)...")
  const [store] = await storeModule.listStores()
  let [salesChannel] = await salesChannelModule.listSalesChannels({ name: "Default Sales Channel" })
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
    })
    salesChannel = result[0]
  }

  const { result: regions } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "India",
          currency_code: "inr",
          countries: ["in"],
          // Manual payment for now. Razorpay will be added as a second provider later.
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const region = regions[0]

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Sindhooram",
        supported_currencies: [{ currency_code: "inr", is_default: true }],
        default_sales_channel_id: salesChannel.id,
        default_region_id: region.id,
      },
    },
  })

  // GST is not configured yet: the India tax region has no rates, so prices are charged as listed.
  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "in", provider_id: "tp_system" }],
  })

  /* ---------- storefront key ---------- */
  const {
    result: [publishableKey],
  } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: STOREFRONT_KEY_TITLE, type: "publishable", created_by: "" }] },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableKey.id, add: [salesChannel.id] },
  })

  /* ---------- commission: 10% of every sale goes to the platform ---------- */
  const { data: defaultRates } = await query.graph({
    entity: "commission_rate",
    fields: ["id"],
    filters: { is_default: true },
  })
  if (defaultRates[0]) {
    await updateCommissionRatesWorkflow(container).run({
      input: [
        {
          id: defaultRates[0].id,
          name: "Sindhooram commission",
          type: "percentage" as never,
          value: COMMISSION_PERCENT,
          is_enabled: true,
        },
      ],
    })
    logger.info(`Global commission set to ${COMMISSION_PERCENT}%.`)
  } else {
    logger.warn("No default commission rate found. Set the Global Commission in the admin panel.")
  }

  /* ---------- owner (admin) login ---------- */
  const adminAuth = await authModule.register("emailpass", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })
  if (adminAuth.success && adminAuth.authIdentity) {
    await createUserAccountWorkflow(container).run({
      input: {
        authIdentityId: adminAuth.authIdentity.id,
        userData: { email: ADMIN_EMAIL, first_name: "Sindhooram", last_name: "Owner" },
      },
    })
    logger.info(`Owner login created: ${ADMIN_EMAIL}`)
  } else {
    logger.warn(`Could not create the owner login (${adminAuth.error}). It may already exist.`)
  }

  /* ---------- categories, collections, tags ---------- */
  logger.info("Creating categories, collections and tags...")
  const categoryIdByName = new Map<string, string>()
  const parents = Object.entries(CATEGORY_TREE)
  const { result: parentCats } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: parents.map(([name, def], rank) => ({
        name,
        handle: def.handle,
        is_active: true,
        rank,
      })),
    },
  })
  parentCats.forEach((c) => categoryIdByName.set(c.name, c.id))
  const { result: childCats } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: parents.flatMap(([name, def]) =>
        def.children.map((child, rank) => ({
          name: child,
          handle: slug(child),
          is_active: true,
          rank,
          parent_category_id: categoryIdByName.get(name)!,
        }))
      ),
    },
  })
  childCats.forEach((c) => categoryIdByName.set(c.name, c.id))

  const { result: collections } = await createCollectionsWorkflow(container).run({
    input: { collections: COLLECTIONS.map((title) => ({ title, handle: slug(title) })) },
  })
  const collectionIdByTitle = new Map(collections.map((c) => [c.title, c.id]))

  const { result: tags } = await createProductTagsWorkflow(container).run({
    input: { product_tags: TAGS.map((value) => ({ value })) },
  })
  const tagIdByValue = new Map(tags.map((t) => [t.value, t.id]))

  /* ---------- one shipping profile for the whole marketplace ---------- */
  const {
    result: [shippingProfile],
  } = await createShippingProfilesWorkflow(container).run({
    input: { data: [{ name: "Marketplace Shipping", type: "default" }] },
  })

  /* ---------- vendors ---------- */
  type Seeded = { id: string; memberId: string; stockLocationId: string }
  const seeded = {} as Record<VendorKey, Seeded>

  for (const [key, v] of Object.entries(VENDORS) as [VendorKey, (typeof VENDORS)[VendorKey]][]) {
    logger.info(`Creating vendor "${v.name}"...`)
    const reg = await authModule.register("emailpass", { body: { email: v.email, password: VENDOR_PASSWORD } })
    if (!reg.success || !reg.authIdentity) {
      throw new Error(`Could not register ${v.email}: ${reg.error}`)
    }

    const { result: seller } = await createSellerAccountWorkflow(container).run({
      input: {
        auth_identity_id: reg.authIdentity.id,
        member_email: v.email,
        first_name: v.first_name,
        last_name: v.last_name,
        seller: {
          name: v.name,
          handle: slug(v.name),
          email: v.email,
          currency_code: "inr",
          description: v.description,
          logo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(v.name)}&backgroundColor=203524&textColor=e8cf8f`,
          banner: v.banner,
        },
        address: { ...v.address, country_code: "in", first_name: v.first_name, last_name: v.last_name },
      },
    })
    await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })

    const { data: members } = await query.graph({ entity: "member", fields: ["id"], filters: { email: v.email } })

    const { result: locations } = await createSellerStockLocationsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        locations: [{ name: `${v.name} Warehouse`, address: { ...v.address, country_code: "in" } }],
      },
    })
    const location = locations[0]

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: location.id, add: [salesChannel.id] },
    })
    if (key === "kanchi") {
      await updateStoresWorkflow(container).run({
        input: { selector: { id: store.id }, update: { default_location_id: location.id } },
      })
    }

    await createLocationFulfillmentSetWorkflow(container).run({
      input: { location_id: location.id, fulfillment_set_data: { name: `${v.name} delivery`, type: "shipping" } },
    })
    const {
      data: [withSet],
    } = await query.graph({ entity: "stock_location", fields: ["fulfillment_sets.id"], filters: { id: location.id } })
    const fulfillmentSetId = withSet?.fulfillment_sets?.[0]?.id as string

    const { result: zones } = await createServiceZonesWorkflow(container).run({
      input: {
        data: [
          {
            fulfillment_set_id: fulfillmentSetId,
            name: `${v.name} India`,
            geo_zones: [{ country_code: "in", type: "country" as const }],
          },
        ],
      },
    })

    const rules = [
      { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
      { attribute: "is_return", value: "false", operator: "eq" as const },
    ]
    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: "Standard Delivery",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: zones[0].id,
            shipping_profile_id: shippingProfile.id,
            type: { label: "Standard", description: "Free, delivered in 5–7 days.", code: "standard" },
            prices: [
              { currency_code: "inr", amount: 0 },
              { region_id: region.id, amount: 0 },
            ],
            rules,
          },
          {
            name: "Express Delivery",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: zones[0].id,
            shipping_profile_id: shippingProfile.id,
            type: { label: "Express", description: "Delivered in 2–3 days.", code: "express" },
            prices: [
              { currency_code: "inr", amount: 250 },
              { region_id: region.id, amount: 250 },
            ],
            rules,
          },
        ],
      },
    })

    seeded[key] = { id: seller.id, memberId: members[0].id as string, stockLocationId: location.id }
  }

  /* ---------- products: each vendor lists their own sarees ---------- */
  for (const key of Object.keys(VENDORS) as VendorKey[]) {
    const vendor = seeded[key]
    const items = CATALOGUE.filter((p) => p.vendor === key)
    const products: (CreateProductDTO & { seller_ids?: string[] })[] = items.map((p) => ({
      title: p.title,
      handle: p.handle,
      description: p.description,
      status: ProductStatus.PUBLISHED,
      material: p.material,
      weight: 800,
      thumbnail: p.images[0],
      images: p.images.map((url) => ({ url })),
      category_ids: [categoryIdByName.get(p.category)!, categoryIdByName.get("Sarees")!],
      collection_id: collectionIdByTitle.get(p.collection),
      tag_ids: p.tag ? [tagIdByValue.get(p.tag)!] : [],
      // rank keeps the launch order on the storefront; compare_at shows a struck-through price
      metadata: { details: p.details, rank: CATALOGUE.indexOf(p), ...(p.compareAt ? { compare_at: p.compareAt } : {}) },
      seller_ids: [vendor.id],
      variants: [{ title: "Free size", sku: p.handle.toUpperCase().replace(/-/g, "_") }],
    }))

    await createProductsWorkflow(container).run({ input: { created_by: vendor.memberId, products } })
  }
  logger.info(`Created ${CATALOGUE.length} sarees.`)

  /* ---------- offers: the vendor's price and stock for each saree ---------- */
  const { data: created } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: { handle: CATALOGUE.map((p) => p.handle) },
  })
  const offers: CreateOfferDTO[] = []
  for (const product of created as { handle: string; variants: { id: string; sku: string }[] }[]) {
    const item = CATALOGUE.find((p) => p.handle === product.handle)!
    const vendor = seeded[item.vendor]
    for (const variant of product.variants) {
      const sku = `SH-${variant.sku}`
      offers.push({
        seller_id: vendor.id,
        created_by: vendor.memberId,
        sku,
        variant_id: variant.id,
        shipping_profile_id: shippingProfile.id,
        inventory_items: [{ sku, stock_levels: [{ location_id: vendor.stockLocationId, stocked_quantity: item.stock }] }],
        prices: [{ amount: item.price, currency_code: "inr" }],
      })
    }
  }
  await createOffersWorkflow(container).run({ input: { offers } })
  logger.info(`Created ${offers.length} offers.`)

  logger.info("---------------------------------------------------------------")
  logger.info("Sindhooram is ready.")
  // On a live site the passwords stay out of the logs.
  logger.info(`Owner panel login:  ${ADMIN_EMAIL} / ${LOCAL_DB ? ADMIN_PASSWORD : "(your SEED_ADMIN_PASSWORD)"}`)
  logger.info(
    `Vendor logins:      ${Object.values(VENDORS).map((v) => v.email).join(", ")} / ${LOCAL_DB ? VENDOR_PASSWORD : "(your SEED_VENDOR_PASSWORD)"}`
  )
  logger.info("---------------------------------------------------------------")
}

/* Runs after every seed (first time or not) and puts the storefront key where the storefront reads it:
     - Docker: the shared file PUBLISHABLE_KEY_FILE (see docker-compose.yml)
     - your Mac with a local database: storefront/.env.local, so `npm run dev` there just works
   For a remote database (Neon) copy the key printed here into Vercel. */
async function shareStorefrontKey(container: MedusaContainer, logger: Logger) {
  const keys = await container.resolve(Modules.API_KEY).listApiKeys({ type: "publishable" })
  const live = keys.filter((k) => !k.revoked_at)
  const key = live.find((k) => k.title === STOREFRONT_KEY_TITLE) || live[0]
  if (!key) {
    logger.warn("No storefront (publishable) key found, so the shop cannot load products yet.")
    return
  }
  logger.info(`Storefront publishable key: ${key.token}`)

  const file = process.env.PUBLISHABLE_KEY_FILE
  if (file) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, key.token)
    logger.info(`Shared the storefront key with the storefront container (${file}).`)
  }
  writeStorefrontKey(key.token, logger)
}

/* Local database on this Mac only: write the key into storefront/.env.local. */
function writeStorefrontKey(token: string, logger: { info: (m: string) => void }) {
  const isLocalDb = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "")
  const storefront = path.resolve(process.cwd(), "../../../storefront")
  if (!isLocalDb || process.env.SEED_WRITE_STOREFRONT_ENV === "false" || !fs.existsSync(path.join(storefront, "package.json"))) {
    return
  }
  const envFile = path.join(storefront, ".env.local")
  const example = path.join(storefront, ".env.example")
  let text = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : fs.existsSync(example) ? fs.readFileSync(example, "utf8") : ""
  const line = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${token}`
  const re = /^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
  fs.writeFileSync(envFile, text)
  logger.info(`Saved the publishable key in ${envFile}`)
}
