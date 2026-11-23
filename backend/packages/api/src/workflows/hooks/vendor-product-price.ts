import type { MedusaContainer, ProductTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import { createVendorOffers, findProductSeller, readPrice, readStock } from "../../lib/vendor-offer"

// Mercur's published types leave out this workflow's hooks; this is the one it declares.
type ProductsCreatedHook = (
  handler: (
    input: { products: ProductTypes.ProductDTO[]; additional_data?: Record<string, unknown> },
    context: { container: MedusaContainer }
  ) => Promise<void>
) => void
const hooks = createProductsWorkflow.hooks as unknown as { productsCreated: ProductsCreatedHook }

/**
 * Runs right after a product is created. When a vendor added it with a price (the "Price" and
 * "Pieces in stock" fields on the vendor panel's Add product form arrive as additional_data),
 * this creates the vendor's offer, so the saree shows on the website with that price as soon as
 * the owner approves it.
 *
 * Never blocks the product itself: if pricing fails, the vendor can still set the price from
 * the product page in the vendor panel.
 */
hooks.productsCreated(async ({ products, additional_data }, { container }) => {
  const data = (additional_data ?? {}) as Record<string, unknown>
  const price = readPrice(data.price)
  if (!price || !products?.length) return
  const stock = readStock(data.stock) ?? 1
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  for (const product of products) {
    try {
      const sellerId = await findProductSeller(container, product.id)
      if (!sellerId) continue
      await createVendorOffers(container, { productId: product.id, sellerId, price, stock })
    } catch (e) {
      logger.warn(
        `Could not save the price for "${product.title}" (${product.id}): ${e instanceof Error ? e.message : e}. ` +
          "The vendor can set it on the product page."
      )
    }
  }
})
