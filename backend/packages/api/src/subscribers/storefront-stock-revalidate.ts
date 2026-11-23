import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { revalidateStorefront } from "../lib/storefront-revalidate"

/**
 * When an order is placed or cancelled, stock changes. Tell the storefront to refresh its cached
 * catalogue so "Only 2 left" / "Sold out" are right straight away (src/lib/storefront-revalidate.ts).
 */
export default async function storefrontStockRevalidateHandler(_: SubscriberArgs<unknown>) {
  await revalidateStorefront(["products", "offers"], "storefront-stock-revalidate")
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.canceled"],
  context: { subscriberId: "storefront-stock-revalidate-handler" },
}
