import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  createVendorOffers,
  getVendorPricing,
  readPrice,
  readStock,
  type VendorPricing,
} from "../../../../lib/vendor-offer"

/**
 * GET  /vendor/product-pricing/:id                   this vendor's price and stock for a product
 * POST /vendor/product-pricing/:id  { price, stock }  set the price of a product that has none yet
 *
 * Used by the "Price & stock" box on the vendor panel's product page
 * (apps/vendor/src/widgets/product-price.tsx). Mercur signs the vendor in and picks their store
 * (x-seller-id header) for every /vendor route. See src/lib/vendor-offer.ts.
 */

type PricingBody = { price?: number | string; stock?: number | string }
type VendorRequest<B = unknown> = AuthenticatedMedusaRequest<B> & { seller_context?: { seller_id: string } }

const sellerOf = (req: VendorRequest<any>) => {
  const id = req.seller_context?.seller_id
  if (!id) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to your store first.")
  return id
}

export async function GET(req: VendorRequest, res: MedusaResponse<VendorPricing>) {
  const sellerId = sellerOf(req)
  const pricing = await getVendorPricing(req.scope, sellerId, req.params.id)
  // another vendor's unpublished product stays private
  if (!pricing.owned && !pricing.offers.length && pricing.product.status !== "published") {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found.")
  }
  res.json(pricing)
}

export async function POST(req: VendorRequest<PricingBody>, res: MedusaResponse<VendorPricing>) {
  const sellerId = sellerOf(req)
  const price = readPrice(req.body?.price)
  if (!price) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Enter the price in rupees (more than ₹0).")
  const stock = readStock(req.body?.stock)
  if (stock === null) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Enter how many pieces you have (0 or more).")

  const before = await getVendorPricing(req.scope, sellerId, req.params.id)
  if (!before.owned) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "You can only price products you added.")
  if (!before.can_set_price) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      before.product.status === "rejected"
        ? "This product was rejected, so it cannot be priced."
        : "This product already has a price. Change it under Offers."
    )
  }

  await createVendorOffers(req.scope, {
    productId: req.params.id,
    sellerId,
    price,
    stock,
    createdBy: req.auth_context?.actor_id,
  })
  res.json(await getVendorPricing(req.scope, sellerId, req.params.id))
}
