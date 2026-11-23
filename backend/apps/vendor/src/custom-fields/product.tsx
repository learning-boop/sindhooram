import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk"
import { createFormHelper } from "@mercurjs/dashboard-shared"

/* "Price (₹)" and "Pieces in stock" on the vendor panel's Add product form (Details tab).
   They are sent with the new product as additional_data; the backend turns them into the
   vendor's offer (packages/api/src/workflows/hooks/vendor-product-price.ts), so the saree shows
   on the website with this price once the owner approves it. */

const form = createFormHelper()

export default defineCustomFieldsConfig({
  model: "product",
  forms: [
    {
      zone: "create",
      tab: "details",
      fields: {
        price: form.define({
          label: "Price (₹)",
          description: "What a customer pays for one piece, in rupees. Shown on the website once the owner approves the product.",
          placeholder: "e.g. 12500",
          type: "number",
          validation: form.coerce
            .number({ error: "Enter the price in rupees." })
            .positive({ error: "Enter a price above ₹0." })
            .max(10_000_000, { error: "That price looks too high." }),
        }),
        stock: form.define({
          label: "Pieces in stock",
          description: "How many pieces you can sell right now.",
          type: "number",
          defaultValue: 1,
          validation: form.coerce
            .number({ error: "Enter how many pieces you have." })
            .int({ error: "Enter whole pieces." })
            .min(0, { error: "Can't be below 0." })
            .max(100_000, { error: "That looks too high." }),
        }),
      },
    },
  ],
})
