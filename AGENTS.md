# PTP Project Guide

## Architecture

PTP is a TanStack Start application deployed on Netlify. The single-page React experience contains the public product story, customer payment dashboard, and merchant operations dashboard. Netlify Functions provide the QR validation, redemption, and merchant batch APIs. Netlify Database stores restaurants, products, one-time QR records, payments, customer profiles, and favorites. Netlify Identity provides browser authentication and protects merchant batch creation.

## Key Directories

- `src/routes/` contains the TanStack route shell and the main application experience.
- `src/data/ptp.ts` contains the fictional restaurant catalog used by the interface and demo seed routine.
- `src/styles.css` contains the complete responsive visual system, motion, dashboard, drawer, and modal styling.
- `db/` contains the Drizzle schema and Netlify Database client.
- `netlify/database/migrations/` contains generated database migrations applied by Netlify.
- `netlify/functions/` contains server-only validation, atomic redemption, and merchant batch logic.
- `public/` contains static brand assets.

## Coding Conventions

- Use TypeScript in strict mode and prefer explicit domain types for API data.
- Keep browser-only APIs inside effects or event handlers so server rendering remains safe.
- Keep persistent state in Netlify Database; do not add JSON-file or in-memory persistence.
- Store only token hashes and payment fingerprints. Never store raw payment credentials.
- Preserve atomic redemption: a QR status update and payment record must commit in one database transaction.
- Protect authenticated mutation endpoints with Netlify Identity and same-origin verification.
- Use the existing CSS variables and component class language when extending the interface.
- Add schema changes to `db/schema.ts` and generate a named migration in `netlify/database/migrations/`.

## Non-Obvious Decisions

- The QR payload contains only an opaque token. Product names, prices, taxes, and merchant details are resolved server-side.
- Three deterministic demo tokens are lazily seeded with the catalog on first validation so the deployed prototype is immediately explorable.
- Browser `BarcodeDetector` powers camera and image scanning where supported; demo codes provide a graceful fallback.
- Payment processing is intentionally simulated, but confirmation, validation, one-time redemption, and history persistence follow the production flow.

## Local Development

Use `pnpm install`, then run Netlify’s local environment on port 8889 with `netlify dev --port 8889`. This is required for Identity, Functions, and Database emulation.
