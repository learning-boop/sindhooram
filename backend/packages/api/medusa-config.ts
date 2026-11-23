import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'
import fs from 'fs'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Resolves where a dashboard app lives:
// - in the source tree (development): ../../apps/<name>
// - in the production build artifact: hosts that deploy only `.medusa/server` (Render, Medusa Cloud)
//   get the panels bundled into ./dashboards/<name> by scripts/bundle-dashboards.mjs during `build`.
//   The compiled config runs from the artifact root, so __dirname points there.
const dashboardAppDir = (name: string) => {
  const bundled = path.join(__dirname, 'dashboards', name)
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, `../../apps/${name}`)
}

/* ---------- public addresses ---------- */

// Variables set by hand always win. Otherwise the backend works its addresses out:
// on Render it reads its own address from RENDER_EXTERNAL_URL, so only STOREFRONT_URL is needed.
const withoutSlash = (url: string) => url.replace(/\/+$/, '')
const backendUrl = withoutSlash(process.env.MERCUR_BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:9000')
const storefrontUrl = withoutSlash(process.env.STOREFRONT_URL || 'http://localhost:3000')
const storeCors = process.env.STORE_CORS || storefrontUrl
const adminCors = process.env.ADMIN_CORS || backendUrl
const vendorCors = process.env.VENDOR_CORS || backendUrl
const authCors = process.env.AUTH_CORS || [...new Set([storeCors, backendUrl])].join(',')

/* ---------- database ---------- */

// A database on this Mac or in Docker runs without SSL. Any other one (Neon) only accepts
// encrypted connections, so SSL is switched on even when its link lacks "?sslmode=require".
// A link pasted without the "?" before its options (".../neondbsslmode=require") is repaired too.
const databaseUrl = process.env.DATABASE_URL?.replace(/\/([^/?]+?)(sslmode=)/i, '/$1?$2')
const localDatabase = !databaseUrl || /@(localhost|127\.0\.0\.1|postgres)(:|\/|\?|$)|sslmode=disable/i.test(databaseUrl)

/* ---------- optional production services (all switched on by environment variables) ---------- */

// Redis: shared events, workflows and locks. Without REDIS_URL everything runs in memory,
// which is fine for local development and a single-instance demo.
const redisUrl = process.env.REDIS_URL || undefined
const redisModules = redisUrl
  ? [
      { resolve: '@medusajs/medusa/event-bus-redis', options: { redisUrl } },
      { resolve: '@medusajs/medusa/workflow-engine-redis', options: { redis: { redisUrl } } },
      {
        resolve: '@medusajs/medusa/locking',
        options: {
          providers: [{ resolve: '@medusajs/medusa/locking-redis', id: 'locking-redis', is_default: true, options: { redisUrl } }],
        },
      },
    ]
  : []

// Product photos uploaded by vendors. Locally they are saved on disk (./static). On hosts with a
// temporary disk (Render) set the S3_* variables (AWS S3, Cloudflare R2, Supabase Storage...) so photos survive restarts.
const fileProvider = process.env.S3_BUCKET
  ? {
      resolve: '@medusajs/medusa/file-s3',
      id: 's3',
      options: {
        file_url: process.env.S3_FILE_URL,
        access_key_id: process.env.S3_ACCESS_KEY_ID,
        secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION || 'auto',
        bucket: process.env.S3_BUCKET,
        endpoint: process.env.S3_ENDPOINT,
        additional_client_config: { forcePathStyle: true },
      },
    }
  : {
      resolve: '@medusajs/medusa/file-local',
      id: 'local',
      options: {
        // The local provider bakes this into every uploaded file URL. It must be the publicly
        // reachable origin in production, or images resolve to localhost and render broken.
        backend_url: process.env.FILE_BACKEND_URL || `${backendUrl}/static`,
      },
    }

module.exports = withMercur({
  projectConfig: {
    databaseUrl,
    ...(localDatabase ? {} : { databaseDriverOptions: { connection: { ssl: { rejectUnauthorized: false } } } }),
    redisUrl,
    workerMode: (process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server') || 'shared',
    http: {
      storeCors,
      adminCors,
      vendorCors,
      authCors,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  featureFlags: {
    // Weavers can sign up from the vendor panel (/seller/register); the owner approves them in the admin panel.
    seller_registration: true,
  },
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: dashboardAppDir('admin'),
        path: '/dashboard',
        disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
      },
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: dashboardAppDir('vendor'),
        path: '/seller',
        disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
      },
    },
    {
      resolve: '@medusajs/medusa/file',
      options: { providers: [fileProvider] },
    },
    ...redisModules,
  ],
})
