/**
 * Tells the storefront to drop its cached catalogue for these tags, so a change made in a panel
 * (product approved, price or stock changed, order placed) shows on the shop straight away.
 * The storefront refreshes on its own every minute anyway (storefront/lib/catalog.js), so a
 * missed call only delays an update; it never breaks anything.
 *
 * Tries twice: the first call after a quiet spell can land on a connection the storefront has
 * already closed. Needs STOREFRONT_REVALIDATE_URL and STOREFRONT_REVALIDATE_SECRET.
 */
const ATTEMPTS = 2
const TIMEOUT_MS = 5000
const RETRY_AFTER_MS = 1500

export async function revalidateStorefront(tags: string[], source = "storefront-revalidate") {
  const url = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET
  if (!url || !secret || !tags.length) {
    return
  }

  let reason = ""
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
        body: JSON.stringify({ tags }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (res.ok) {
        return
      }
      reason = `HTTP ${res.status}`
    } catch (error) {
      reason = error instanceof Error ? error.message : String(error)
    }
    if (attempt < ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER_MS))
    }
  }
  // One line, not a stack trace: the storefront is often just not running (yet).
  console.warn(`[${source}] could not refresh the storefront at ${url} (${reason}); it refreshes by itself within a minute`)
}
