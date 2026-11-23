# Sindhooram backend

Mercur 2.4 (multi-vendor marketplace) on Medusa 2.22 — the API, the owner panel (`/dashboard`) and the vendor panel (`/seller`).

```bash
bun install
bun run migrate   # database tables
bun run seed      # demo vendors, sarees, owner login, 10% commission
bun run dev       # http://localhost:9000  (+ /dashboard, /seller)
```

Production: `bun run build:ci` then `npm run start` (applies migrations, then starts). Settings: `packages/api/.env.template`.
See the README one folder up for the full guide (local setup, logins, Neon + Render + Vercel demo).
