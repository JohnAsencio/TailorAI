# Stripe Payments Setup

Use **test keys** first. When everything works, switch to **live keys** and repeat the webhook step for your live endpoint.

---

## 1. Get your Stripe keys (test mode)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com).
2. Turn **Test mode** ON (toggle in the top right).
3. Go to **Developers → API keys**.
4. Copy:
   - **Publishable key** (starts with `pk_test_`) — optional for this app; we use server-only flow.
   - **Secret key** (starts with `sk_test_`) — **required**. Click “Reveal” and copy it.

---

## 2. Set environment variables (test keys)

In your project root, create or edit `.env.local`:

```env
# Stripe (use test keys first)
STRIPE_SECRET_KEY=your-stripe-secret-key-here

# Webhook signing secret (you’ll add this in step 4)
STRIPE_WEBHOOK_SECRET=your-webhook-signing-secret-here

# Supabase (you said these are already set)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

For local dev with `vercel dev`, this file is loaded automatically.  
For Vercel deployment, add the same variables in **Project → Settings → Environment Variables**.

---

## 3. Stripe products (test mode)

The app uses **dynamic pricing** for **Unlimited** and **Lifetime** (no Price IDs required).  
For **Basic** and **Pro**, you can optionally create products and set Price IDs (or use dynamic pricing):

1. In Stripe Dashboard (test mode), go to **Product catalog → Add product**.
2. Create a “Pro Plan” product and a recurring price (e.g. $12.99/month).
3. Copy the **Price ID** (e.g. `price_xxxx`).
4. Add to `.env.local`:
   ```env
   STRIPE_PRICE_BASIC=price_xxxx
   STRIPE_PRICE_PRO=price_xxxx
   ```
   If you don’t set this, checkout still works using dynamic pricing.

---

## 4. Webhook (so your app knows when someone paid)

Stripe will call your server when a payment or subscription event happens. Your `api/stripe-webhook.js` uses this to update Supabase.

### 4a. Deployed app (e.g. Vercel)

1. Deploy your app so you have a public URL (e.g. `https://your-app.vercel.app`).
2. In Stripe Dashboard (test mode): **Developers → Webhooks → Add endpoint**.
3. **Endpoint URL:**  
   `https://your-app.vercel.app/api/stripe-webhook`  
   (replace with your real URL).
4. Click **Select events** and add:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**.
6. Open the new webhook → **Reveal** the **Signing secret** (starts with `whsec_`).
7. Put that value in `.env.local` and Vercel env as:
   ```env
   STRIPE_WEBHOOK_SECRET=your-webhook-signing-secret-here
   ```
8. Redeploy so the new env var is picked up.

### 4b. Local testing (optional)

To test the webhook on your machine:

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli):  
   `brew install stripe/stripe-cli/stripe` (macOS) or see Stripe docs.
2. Log in:  
   `stripe login`
3. Forward webhooks to your local server:  
   `stripe listen --forward-to localhost:3000/api/stripe-webhook`  
   (Use the port your `vercel dev` uses, often 3000.)
4. The CLI will print a **webhook signing secret** (e.g. `whsec_...`). Use that in `.env.local` for **STRIPE_WEBHOOK_SECRET** while testing locally.
5. Run your app with `vercel dev`, then trigger a test payment; the CLI will show incoming events.

---

## 5. Supabase tables

Your webhook writes to Supabase. Ensure you have:

- **subscriptions** — columns used by the webhook: `email` (unique), `user_id`, `stripe_customer_id`, `plan_id`, `plan_name`, `status`, `current_period_end`, `updated_at`, and optionally `is_prelaunch_special`, `price_paid_cents`.
- **app_users** (optional but recommended) — used for quick lookup; the webhook upserts by `email` with `user_id`, `stripe_customer_id`, `plan_id`, `plan_name`, `plan_status`, `updated_at`.

RLS: allow users to read their own subscription (e.g. `auth.uid() = user_id` on `subscriptions`).

---

## 6. Quick test (test mode)

1. Run the app (`vercel dev` or open the deployed URL).
2. Sign in, go to **Pricing**, choose **Unlimited** or **Lifetime**.
3. At Stripe Checkout, use test card: **4242 4242 4242 4242**, any future expiry, any CVC, any billing details.
4. Complete payment. You should be redirected back with a success message and the header should show your plan badge.
5. In Stripe Dashboard (test mode), check **Payments** and **Webhooks** (event logs) to confirm the event was sent and the endpoint returned 200.

---

## 7. Switch to live keys

When you’re ready to accept real payments:

1. In Stripe Dashboard, turn **Test mode** OFF.
2. Go to **Developers → API keys** and copy your **live Secret key** (`sk_live_...`).
3. Replace **STRIPE_SECRET_KEY** in Vercel (and `.env.local` for local checks) with the live secret. Never commit live keys to git.
4. Create a **new webhook** in live mode:
   - **Developers → Webhooks → Add endpoint**
   - URL: `https://your-production-domain.com/api/stripe-webhook`
   - Same events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the **live** webhook signing secret and set **STRIPE_WEBHOOK_SECRET** to this new value (live and test signing secrets are different).
6. Optionally create live products/prices and set **STRIPE_PRICE_PRO** for live if you use it.
7. Redeploy. Run a small real payment and confirm the webhook fires and your app updates the user’s plan.

---

## Checklist

- [ ] Stripe **test** Secret key in `STRIPE_SECRET_KEY`
- [ ] Webhook endpoint added in Stripe (test) with the three events
- [ ] Webhook **signing secret** in `STRIPE_WEBHOOK_SECRET`
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `subscriptions` (and optionally `app_users`) tables exist in Supabase
- [ ] Test payment with card 4242 4242 4242 4242 and confirm success + plan badge
- [ ] When going live: switch to live Secret key and create a **new** live webhook + live signing secret
