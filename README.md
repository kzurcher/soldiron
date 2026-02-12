## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Open [http://localhost:3000](http://localhost:3000).

## Subscription Setup (Stripe)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_... # optional yearly plan
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Stripe Dashboard Steps

1. Create a recurring product + price in Stripe.
2. Copy the `price_...` ID into `STRIPE_PRICE_ID`.
3. Use your Secret Key as `STRIPE_SECRET_KEY`.

### Webhook (Local Dev)

Install Stripe CLI and run:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Copy the emitted webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

### Current Subscription Flow

1. User goes to `/subscribe`.
2. Stripe Checkout starts subscription.
3. Webhook marks subscription active.
4. Listing submission (`/list-machine`) requires active subscription by seller email.

## Deploy on Vercel

Set production env vars in Vercel:

- `NEXT_PUBLIC_APP_URL` (your public domain)
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

Then configure a Stripe webhook endpoint to:

`https://YOUR_DOMAIN/api/billing/webhook`
