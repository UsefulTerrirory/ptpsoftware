# PTP — Picture To Payment

PTP is a polished fintech prototype that lets a customer pay for one physical food item by scanning the unique QR code printed on its package. The code contains only an opaque, one-time token; the trusted backend resolves the restaurant, product, price, tax, and redemption state before presenting a payment confirmation.

The experience includes a product landing page, camera and image QR scanning, explicit checkout confirmation, already-redeemed handling, payment history, loyalty, favorites, saved payment methods, customer profiles, notifications, settings, and a merchant command center for code batches, inventory health, revenue, analytics, and live activity. All restaurant brands and menu items are fictional.

## Technology

- TanStack Start, React 19, and TypeScript
- Netlify Functions for QR and merchant APIs
- Netlify Database with Drizzle ORM and generated migrations
- Netlify Identity for customer and merchant authentication
- Browser `BarcodeDetector` for camera and uploaded-image QR recognition
- QRCode for merchant batch previews
- Tailwind CSS 4 tooling with a bespoke responsive CSS design system

## Security Model

- QR payloads contain no product or price information.
- SHA-256 token hashes are indexed in Postgres; raw tokens are returned only when a merchant creates a batch.
- Redemption uses a conditional update and payment insert inside one transaction, preventing double payment under concurrent scans.
- Saved payment credentials are represented only by non-reversible fingerprints in this prototype.
- Merchant mutations require an authenticated Netlify Identity session and same-origin request verification.

## Run Locally

1. Install dependencies with `pnpm install`.
2. Start the complete Netlify environment with `netlify dev --port 8889`.
3. Open `http://localhost:8889`.

Netlify provisions the managed database and applies migrations during deployment. Local Identity, Functions, and database behavior should be exercised through Netlify Dev rather than the plain Vite server.

## Demo Codes

- `PTP-NOVA-8K2M-4Q7X`
- `PTP-SOLAR-3V9L-7C2P`
- `PTP-NEON-6D4R-1W8N`

Each code represents one physical item and becomes unusable after a successful deployed redemption.
