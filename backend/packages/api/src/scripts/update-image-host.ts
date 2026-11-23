/**
 * Moves the seeded product photos to a new storefront address.
 *
 * The demo sarees' photos are served by the storefront (storefront/public/assets), so their URLs
 * start with the storefront address used when seeding (STOREFRONT_URL). When the storefront moves
 * (localhost → Vercel → your own domain), run:
 *
 *   OLD_HOST=http://localhost:3000 NEW_HOST=https://sindhooram.vercel.app npm run update-image-host
 *
 * Photos vendors upload themselves are stored by the backend and are not touched.
 */
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function updateImageHost({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const from = (process.env.OLD_HOST || "").replace(/\/$/, "")
  const to = (process.env.NEW_HOST || "").replace(/\/$/, "")
  if (!from || !to) {
    logger.error("Set OLD_HOST and NEW_HOST, e.g. OLD_HOST=http://localhost:3000 NEW_HOST=https://sindhooram.vercel.app")
    return
  }

  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any
  const like = `${from}/%`
  const images = await knex.raw(`update image set url = replace(url, ?, ?) where url like ?`, [from, to, like])
  const thumbs = await knex.raw(`update product set thumbnail = replace(thumbnail, ?, ?) where thumbnail like ?`, [from, to, like])
  const banners = await knex.raw(`update seller set banner = replace(banner, ?, ?) where banner like ?`, [from, to, like])
  const lines = await knex.raw(`update order_line_item set thumbnail = replace(thumbnail, ?, ?) where thumbnail like ?`, [from, to, like])

  logger.info(
    `Moved photos from ${from} to ${to}: ${images.rowCount} images, ${thumbs.rowCount} thumbnails, ` +
      `${banners.rowCount} vendor banners, ${lines.rowCount} order lines. Restart the backend to clear its cache.`
  )
}
