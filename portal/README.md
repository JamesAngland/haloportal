# Client Portal (Next.js + Prisma)

This folder is a starter scaffold for the **client portal**:

- Users can **log in**
- Users can view **their own devices**
- Users can **search company devices by serial number** and **claim** a device **only if it is unassigned**
- Devices are highlighted when **age ≥ 5 years** and/or OS is **EOL** (via `os_lifecycle`)
- “Replace device” button calls a **service request endpoint** (currently a stub; swap for HaloPSA catalogue call)

## Quickstart (local)

1) Install Node.js (LTS) and a Postgres database.

2) Copy env file:

```bash
cp .env.example .env
```

Set:

- `DATABASE_URL=...`
- `SESSION_SECRET=...` (any long random string)

3) Install dependencies + migrate + seed:

```bash
npm install
npm run db:migrate
npm run db:seed
```

4) Run:

```bash
npm run dev
```

Login with:

- Email: `user@example.co`
- Password: `password123`

## Key example code

- **Schema**: `prisma/schema.prisma`
- **Login**: `src/app/api/auth/login/route.ts`
- **Search unassigned assets by serial**: `src/app/api/assets/search/route.ts`
- **Claim asset (enforces “only if unassigned”)**: `src/app/api/me/assets/claim/route.ts`
- **My Devices page (age + EOL highlight)**: `src/app/devices/page.tsx`
- **Claim UI**: `src/app/devices/claim/page.tsx`
- **Replace device stub endpoint**: `src/app/api/service-requests/replace-device/route.ts`

## Swapping the stub for HaloPSA

Replace the body of `src/app/api/service-requests/replace-device/route.ts` with:

- Lookup the correct service catalogue item (by mapping table or config)
- Create a service request in HaloPSA using your integration credentials
- Return `{ ticketId, url }` so the portal can link the user to the request

