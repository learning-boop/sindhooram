import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  OfferWorkflowEvents,
  ProductWorkflowEvents,
} from "@mercurjs/core/workflows"
import { revalidateStorefront } from "../lib/storefront-revalidate"

type EventPayload = {
  id?: string
  product_id?: string
}

const resolveProductHandle = async (
  container: SubscriberArgs["container"],
  productId?: string
): Promise<string | undefined> => {
  if (!productId) {
    return undefined
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["handle"],
      filters: { id: productId },
    })
    return data?.[0]?.handle
  } catch {
    return undefined
  }
}

const buildTags = async (
  container: SubscriberArgs["container"],
  eventName: string,
  payload: EventPayload
): Promise<string[]> => {
  const tags = new Set<string>(["products"])

  const isOffer = eventName.startsWith("offer.")
  const productId = isOffer ? payload.product_id : payload.id

  const handle = await resolveProductHandle(container, productId)
  if (handle) {
    tags.add(`product-${handle}`)
  }

  if (isOffer) {
    tags.add("offers")
    if (payload.id) {
      tags.add(`offer-${payload.id}`)
    }
    if (productId) {
      tags.add(`product-offers-${productId}`)
    }
  }

  return [...tags]
}

export default async function storefrontCacheRevalidateHandler({
  event,
  container,
}: SubscriberArgs<EventPayload | EventPayload[]>) {
  if (!process.env.STOREFRONT_REVALIDATE_URL || !process.env.STOREFRONT_REVALIDATE_SECRET) {
    return
  }

  const payloads = Array.isArray(event.data) ? event.data : [event.data]

  const tagSet = new Set<string>()
  for (const payload of payloads) {
    const tags = await buildTags(container, event.name, payload ?? {})
    tags.forEach((tag) => tagSet.add(tag))
  }

  await revalidateStorefront([...tagSet], "storefront-cache-revalidate")
}

export const config: SubscriberConfig = {
  event: [
    OfferWorkflowEvents.CREATED,
    OfferWorkflowEvents.UPDATED,
    OfferWorkflowEvents.DELETED,
    ProductWorkflowEvents.PUBLISHED,
    ProductWorkflowEvents.REJECTED,
    "product.updated",
  ],
  context: {
    subscriberId: "storefront-cache-revalidate-handler",
  },
}
