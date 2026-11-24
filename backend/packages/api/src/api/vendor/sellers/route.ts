import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SellerStatus } from "@mercurjs/types"

/**
 * GET /vendor/sellers   the stores the signed-in vendor belongs to
 *
 * Same as Mercur's own route, with one fix for new vendors. Right after "Create an account"
 * the vendor has no store yet, and Mercur 2.4.1 answers 401 here. The vendor panel treats any
 * 401 as "signed out" and forgets the sign-up, so the store wizard could never get past step 1
 * (the shop-link check and "Create store" both need it). Now a new vendor gets an empty list.
 *
 * Routes in this project load after Mercur's, so this GET replaces Mercur's GET only;
 * POST /vendor/sellers (create the store) and all middlewares stay Mercur's.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const memberId = req.auth_context?.actor_id
  if (!memberId) {
    res.json({ seller_members: [], count: 0, offset: 0, limit: req.queryConfig?.pagination?.take ?? 0 })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: sellerMembers, metadata } = await query.graph({
    entity: "seller_member",
    fields: req.queryConfig.fields,
    filters: {
      member_id: memberId,
      seller: { status: { $ne: SellerStatus.TERMINATED } },
    } as any,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    seller_members: sellerMembers,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  })
}
