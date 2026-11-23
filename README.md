# Sindhooram — multi-vendor saree marketplace

Weavers and saree houses (vendors) list their sarees, customers buy from several vendors in one bag,
and Sindhooram (the owner) keeps a **10% commission** on every sale.

| Folder | What it is |
|---|---|
| `storefront/` | The shop customers see: **Next.js 16**, the same Sindhooram design as before (curtain, hero film, sections, quick view, bag), plus a full shop page with filters, product pages, vendor pages, guest checkout, order tracking and My orders |
| `backend/` | **Mercur 2.4** (open-source marketplace on **Medusa 2.22**): the API, the **owner panel** (`/dashboard`) and the **vendor panel** (`/seller`). Database: **PostgreSQL** |
| `docker-compose.yml` | Runs everything (database, backend, shop) on your Mac with one command |
| `render.yaml` | One-click deploy of the backend on Render |
| `_old-vite-site/` | The previous Vite version of the site, kept for reference. Delete it once you are happy |

## How the marketplace works

1. **A vendor signs up** in the vendor panel (`/seller/register`). The owner approves the vendor in the owner panel → **Stores**.
2. **The vendor adds a saree** in the vendor panel → Products → Create: photos, description, category, and **Price (₹)** and **Pieces in stock** on the first tab. Their price and stock are saved as an *offer* (Mercur's word for a vendor's listing). A vendor who has no warehouse yet gets one set up automatically, with free Standard and ₹250 Express delivery.
3. **The owner approves it** (Overview → *Products waiting for approval*, or Products → **Inbox** → open it → **Confirm**). Only then does it show on the site, with “Sold by …”. On the product page the vendor sees a **Price & stock** box with its status; a product without a price can be priced there.
4. **A customer checks out** with pieces from several vendors, **no account needed** (email, phone and address; returning customers can sign in instead). The order is split into **one order per vendor** (an *order group*); each vendor sees only their own order and ships it. Guests follow their order on **Track order** (email + order number) and can save it to a new account from the confirmation page.
5. **Commission**: every vendor order gets a commission line — 10% of the item price (delivery and tax are not included). Change it in the owner panel → **Settings → Commissions** (global rate, or rules per vendor/category).
6. **Payment** is a *test payment* for now (orders are placed, no money moves). Razorpay, COD and returns come next.
7. **The owner panel opens on Overview**: commission earned, sales, orders, products and vendors waiting for approval, customers, a 30-day sales chart, vendors by sales and the latest orders. The built-in pages are under **Marketplace** in the sidebar.

To let vendor products go live without the owner's approval, set `MEDUSA_FF_PRODUCT_REQUEST=false` for the backend (in `docker-compose.yml` under `backend → environment`).

The demo data (`bun run seed`) creates 3 approved vendors — **Kanchi Silk House**, **Banaras Weaves**, **Kalakaari Studio** — with the 13 sarees from the original site, each vendor with free Standard and ₹250 Express delivery.

## Run it with Docker (easiest)

Docker runs the database, the backend and the shop together, so you don't install Node, Bun or Postgres.

1. Install **Docker Desktop for Mac** (the *Apple chip* version) from docker.com, open it, and wait until it shows *Engine running*.
   In Docker Desktop → **Settings → Resources**, give it at least **4 GB** of memory.
2. In Terminal:

```bash
cd ~/Documents/office/creatortouch/todo_Project/sindhooram
docker compose up --build
```

The first run takes about 10 minutes: it downloads everything, builds the backend and both panels, creates the tables
and the demo data, then builds the shop. It's ready when the log shows **`Shop ready: http://localhost:3000`**.
Then open the addresses in the table below (same logins).

| To | Run this in the sindhooram folder |
|---|---|
| Start it again another day | `docker compose up` (add `-d` to keep the Terminal free) |
| Stop | `Ctrl + C`, or `docker compose down` if you used `-d` |
| Use changed code | `docker compose up --build` |
| Start over with fresh demo data | `docker compose down -v`, then `docker compose up` |
| Read the backend's log | `docker compose logs -f backend` |

Good to know:
- Docker runs the production build, so code changes show up after `docker compose up --build` (a few minutes).
  For coding with instant reload, use the setup below without Docker; you can still keep just the database in Docker:
  `docker compose up -d postgres`, and in `backend/packages/api/.env` set
  `DATABASE_URL=postgres://sindhooram:sindhooram@localhost:5433/sindhooram`.
- Ports 3000, 9000 and 5433 must be free: stop `bun run dev` / `npm run dev` before `docker compose up`, and the other way round.
- Open the database in TablePlus or Postico: `postgres://sindhooram:sindhooram@localhost:5433/sindhooram`.
- Docker's settings (passwords, WhatsApp number...) are in `docker-compose.yml`. They are for your Mac only; the online demo uses its own (see *Demo deployment*).

## Run it on your Mac without Docker

**Once:** install the tools with Homebrew (skip any you already have: Node 22.22+ / 24, Bun 1.3+, PostgreSQL 14+):

```bash
brew install node@24 oven-sh/bun/bun postgresql@16
echo 'export PATH="/opt/homebrew/opt/node@24/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
brew services start postgresql@16
createdb sindhooram
```

`backend/packages/api/.env` connects to `postgres://madhusudhan@localhost:5432/sindhooram` (your Mac user, no password — the Homebrew default). If your Postgres uses another user or password, edit that line.

**Backend** (terminal 1):

```bash
cd backend
bun install
bun run migrate      # creates the tables
bun run seed         # vendors, sarees, owner login, 10% commission; also writes the store key into storefront/.env.local
bun run dev          # API + both panels on http://localhost:9000
```

**Storefront** (terminal 2):

```bash
cd storefront
npm install
npm run dev          # http://localhost:3000
```

| Open | Address | Login |
|---|---|---|
| Shop | http://localhost:3000 (all products: `/shop`, order tracking: `/track-order`) | none needed to buy; an account is optional |
| Owner panel | http://localhost:9000/dashboard | `admin@sindhooram.com` / `Sindhooram@123` |
| Vendor panel | http://localhost:9000/seller | `kanchi@example.com`, `banaras@example.com` or `kalakaari@example.com` / `Vendor@123` |
| New vendor sign-up | http://localhost:9000/seller/register | |
| Coming-soon page | http://localhost:3000/coming-soon | (set `NEXT_PUBLIC_SITE_MODE=coming-soon` to show it at `/`) |

Try it: open **Shop** and filter by weave, price or weaver → add sarees from two vendors to the bag → checkout as a guest → the confirmation shows two vendor orders and your order number (try it on **Track order**). In the owner panel, **Overview** shows the sale and the commission; open the order under **Orders** to see the **Commission** line (₹2,180 on a ₹21,800 saree). Log in as that vendor to see only their order.

## Demo deployment (Neon + Render + Vercel)

The live demo runs from the **`marketplace`** branch of `github.com/learning-boop/sindhooram` (the coming-soon site stays on `main`), all in **Singapore** (closest to India).

**1. Database — Neon:** project `sindhooram`. *Connect* → turn **off** connection pooling → copy the connection string (`postgresql://…neon.tech/neondb?sslmode=require`).

**2. Backend — Render:** the Blueprint in `render.yaml` creates `sindhooram-backend`. It reads three values you type in once, in an environment group named **`sindhooram-secrets`** (Render → *Environment Groups* → *New Environment Group*):

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon connection string from step 1 |
| `SEED_ADMIN_PASSWORD` | a password you choose for the owner login `admin@sindhooram.com` |
| `SEED_VENDOR_PASSWORD` | a password you choose for the three demo vendor logins |

The code is public, so on a live database the seed refuses to create logins until both passwords are set (the Docker defaults are never used there).
Every build ends by updating the database tables; the first one also adds the demo data (owner login, 10% commission, vendors, sarees) and prints the **Storefront publishable key** (`pk_…`) in the build log.
Everything else is worked out by the backend: its own address from Render (`RENDER_EXTERNAL_URL`), the shop's from `STOREFRONT_URL` in `render.yaml`, and CORS and photo links from both. Check `https://<render-address>/health` says OK.

**3. Storefront — Vercel:** project `sindhooram-store`, **Root Directory `storefront`**, branch `marketplace`, with these environment variables:

| Name | Value |
|---|---|
| `MEDUSA_BACKEND_URL` | `https://<render-address>` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | the `pk_…` key from step 2 |
| `NEXT_PUBLIC_SITE_URL` | `https://sindhooram-store.vercel.app` |
| `NEXT_PUBLIC_VENDOR_PANEL_URL` | `https://<render-address>/seller` |

If the shop moves to another address, change `STOREFRONT_URL` on Render and move the photo links:
`cd backend/packages/api && OLD_HOST=https://sindhooram-store.vercel.app NEW_HOST=https://<new-address> DATABASE_URL=… bun run update-image-host`.

**Instant shop refresh (optional):** without it, approvals, prices and stock show on the shop within a minute. For instant updates add the same long random text as `STOREFRONT_REVALIDATE_SECRET` (Render) and `REVALIDATE_SECRET` (Vercel), plus `STOREFRONT_REVALIDATE_URL` = `https://sindhooram-store.vercel.app/api/revalidate` on Render.

**Demo links to share:** the Vercel address (shop), `<render-address>/dashboard` (owner), `<render-address>/seller` (vendors).

Good to know about the free plans:
- Render **free** sleeps after 15 minutes without visitors; the next visit waits about a minute while it wakes. It also has 512 MB of memory and the backend uses about 400–460 MB, so for the client meeting switch the service to **Standard** (2 GB, $25/month) or open the site a minute before.
- Render's disk is wiped on every restart, so **photos vendors upload** disappear unless you add storage: fill the `S3_*` variables (Cloudflare R2 or AWS S3, see `backend/packages/api/.env.template`). The seeded sarees are not affected (their photos are served by the storefront).

## Where things live

```
docker-compose.yml          the Docker setup (database + backend + storefront)
storefront/
  Dockerfile, docker-start.sh   how Docker builds and starts the shop
  app/(store)/              home, shop, products/[handle], sellers/[handle], checkout, track-order, account, order/confirmed
  app/(coming-soon)/        the countdown page (its own layout and stylesheet)
  components/store/         the ported design components + new pages
  lib/catalog.js            reads products, prices, stock and vendors from the backend
  lib/actions/              bag, checkout, account and orders (Next.js server actions; cart & login kept in httpOnly cookies)
  lib/shop-filters.js       the shop page filters (weave, price, weaver, highlights), kept in the address bar
  lib/config.js             site settings (was src/config.js)
  styles/store.css          the original design · styles/marketplace.css  the new pages
backend/
  Dockerfile, docker-entrypoint.sh      how Docker builds the backend; on start: tables → demo data (first time) → server
  packages/api/medusa-config.ts         modules, panels, optional Redis and S3
  packages/api/src/scripts/seed.ts      the demo data (vendors, sarees, commission, owner login)
  packages/api/src/subscribers/         tells the storefront to refresh when products, prices or stock change
  packages/api/src/api/admin/overview   numbers for the owner's Overview page
  packages/api/src/lib/vendor-offer.ts  turns a vendor's price and stock into an offer (+ warehouse for new vendors)
  packages/api/src/workflows/hooks/     runs it when a vendor creates a product · src/api/vendor/product-pricing  the Price & stock box
  apps/vendor/src/custom-fields/        Price and Pieces in stock on the Add product form · apps/vendor/src/widgets  the Price & stock box
  packages/api/src/api/store/order-lookup   order tracking without an account, and saving a guest order to an account
  packages/api/src/lib/order-progress.ts  what a customer sees of an order: packed / shipped / delivered and the tracking number
  packages/api/src/api/store/my-order-groups   a signed-in customer's orders (account page) with that progress
  apps/admin/src/routes/overview        the Overview page · apps/admin/src/_navigation.ts  the owner sidebar
  apps/admin, apps/vendor               the two panels (Sindhooram name and logo; add pages and widgets here)
```

## Not built yet

- **Razorpay** checkout and vendor payouts (Razorpay Route: hold the vendor's share until delivery)
- **COD**, returns and refunds
- **GST** rates and invoices (prices are shown as inclusive of taxes; the India tax region has no rates yet)
- Order emails/SMS (needs a notification provider such as Resend)
- Photo storage for vendor uploads in production (R2/S3, see above)
