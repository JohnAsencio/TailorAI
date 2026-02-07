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

## 3. Stripe products (test mode) — link to your Dashboard

**Why checkout looks different and you don't see analytics:**  
If you don't set the Price ID env vars below, the app uses **dynamic pricing**: it creates inline products with names/descriptions from code (e.g. "1 Credit", "Basic Plan"). Those checkouts are **not** linked to products in your Stripe Dashboard, so the checkout page shows the app's hardcoded description and Stripe analytics won't show sales under your Dashboard products.

**To link the app to your Stripe products** (same description on checkout, analytics under your products), create products in Stripe and set Price IDs:

1. In Stripe Dashboard (test mode), go to **Product catalog → Add product**.
2. Create a “Pro Plan” product and a recurring price (e.g. $12.99/month).
3. Copy the **Price ID** (e.g. `price_xxxx`).
4. Add to `.env.local` and **Vercel → Environment Variables**:
   ```env
   STRIPE_PRICE_CREDITS=price_xxxx
   STRIPE_PRICE_BASIC=price_xxxx
   STRIPE_PRICE_PRO=price_xxxx
   STRIPE_PRICE_LIFETIME=price_xxxx
   ```
   (Set only the ones you created in Stripe; omit others. The app falls back to dynamic pricing for any unset price.)
   If you don’t set this, checkout still works using dynamic pricing.

---

### Linking your "Credits" product (optional)

If you created a product named **Credits** in the Stripe Dashboard (test mode) and want the app to use it:

1. In Stripe Dashboard (test mode), go to **Product catalog** and open your **Credits** product.
2. Create or select a **one-time price** (e.g. $1.00 per unit).
3. Copy the **Price ID** (e.g. `price_xxxx`).
4. Add to `.env.local` and Vercel env:
   ```env
   STRIPE_PRICE_CREDITS=price_xxxx
   ```
5. Redeploy. The credits checkout will use this price (and quantity = number of credits). The webhook will recognize credits purchases by this price ID and by product name "Credit(s)".

If you don't set `STRIPE_PRICE_CREDITS`, the app creates a dynamic product per checkout and the webhook detects credits by product name.

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
   - `checkout.session.completed` (plan purchases and one-time credit purchases)
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid` (monthly subscription renewal — refills credits for Basic/Pro)
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

### 4c. Debugging: see what Stripe sends and what your app returns

1. **Stripe Dashboard → Developers → Webhooks** → click your endpoint (test or live).
2. Open **Recent deliveries**. Each row is a webhook Stripe sent. Click one to see:
   - **Request**: body and headers Stripe sent.
   - **Response**: status code and body your app returned.
3. If status is **400** and the response says "signature" or "No signatures found":
   - The raw body your app received doesn’t match what Stripe signed. Ensure `api/stripe-webhook.js` uses the **raw** body (no JSON parse before verification).
   - Or **STRIPE_WEBHOOK_SECRET** doesn’t match this endpoint: use the **Signing secret** from this same endpoint (test endpoint → test secret, live endpoint → live secret).
4. If status is **200** but credits/plan don’t update: check your app’s logs (e.g. Vercel function logs) for DB errors; the handler might be failing after returning 200 (e.g. Supabase update error).

### Why stripe listen might not receive any events

- **Events only fire when something happens in Stripe.** If credits checkout fails with "No such price" before you reach Stripe Checkout, no payment is created, so Stripe never sends `checkout.session.completed`. Fix the price ID first (see "Credits checkout" and `/api/verify-stripe-price`), then complete a successful payment — you should see events in the CLI.
- **Use the CLI’s signing secret.** While using `stripe listen`, set `STRIPE_WEBHOOK_SECRET` in `.env.local` to the **whsec_...** value the CLI prints (not a Dashboard webhook secret). Restart `vercel dev` after changing `.env.local`.
- **Same Stripe account.** The CLI is tied to the account you used in `stripe login`. Your app must use the **same** account’s `STRIPE_SECRET_KEY` and products/prices (test mode). If the key is from a different account, events from that key’s account won’t appear in this CLI session.
- **Port must match.** `stripe listen --forward-to localhost:3000/api/stripe-webhook` must use the same port as your API (often 3000 with `vercel dev`). If your app runs on a different port, change the `--forward-to` URL.
- **Trigger a real test payment.** After fixing the price: in the app, go to Profile → Buy credits, complete checkout with card 4242 4242 4242 4242. The CLI should show `checkout.session.completed` and your webhook handler will run.

---

## 5. Supabase tables

Your webhook writes to Supabase. Ensure you have:

- **subscriptions** — columns used by the webhook: `email` (unique), `user_id`, `stripe_customer_id`, `plan_id`, `plan_name`, `status`, `current_period_end`, `updated_at`, and optionally `is_prelaunch_special`, `price_paid_cents`.
- **app_users** (recommended) — used for credits and plan display; the webhook and API use `user_id`, `email`, `plan_id`, `plan_status`, `resume_credits`, `updated_at`. Display names come from config (`plan_id` → name). **plan_name** is not used by the app; you can drop that column if it exists.

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
   - Same events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
5. Copy the **live** webhook signing secret and set **STRIPE_WEBHOOK_SECRET** to this new value (live and test signing secrets are different).
6. Optionally create live products/prices and set **STRIPE_PRICE_PRO** for live if you use it.
7. Redeploy. Run a small real payment and confirm the webhook fires and your app updates the user’s plan.

---

## Debugging credits webhook (Vercel logs)

When a user buys credits, the webhook logs to Vercel so you can see why credits might not update:

1. **Vercel Dashboard** → your project → **Logs** (or **Deployments** → select deployment → **Functions** → `stripe-webhook`).
2. Filter or search for **`[credits-webhook]`** to see only credits-related lines.
3. After a credits purchase, check:
   - **checkout.session.completed** — `mode`, `isOneTimePayment`, `metadataKeys`, `metadataCreditsQuantity`. If metadata is empty, Stripe may not be sending it.
   - **line-items result** — whether quantity was found from product name/price. If `fromLineItems` is null, product name may not match "Credit(s)" or `STRIPE_PRICE_CREDITS` may not match.
   - **addCreditsFromSession entry** — `userIdPresent`, `emailPresent`, `creditsQuantity`. If missing, enrich or metadata failed.
   - **addCreditsFromSession lookup** — `rowExists`, `currentCredits`, `updateByUserId`/`updateByEmail`. If `rowExists` is false, no row was found for that user/email.
   - **addCreditsFromSession update by user_id/email** — `error` and `rows`. If `error` is set, Supabase rejected the update; if `rows === 0`, no row matched.

Common causes: webhook not receiving metadata (use `STRIPE_PRICE_CREDITS` and product name detection); email/userId not matching `app_users`; Supabase RLS or missing column.

### Webhook signature verification failed (400) and credits not updating

If you see **"Webhook signature verification failed. No signatures found matching the expected signature"** in logs and Stripe CLI shows **&lt;-- [400]** for events:

- **Cause:** Stripe signs the **raw** request body. If the platform parses the body as JSON before your handler runs, the body is modified and the signature no longer matches, so the handler returns 400 and never runs the logic that updates credits.
- **Fix:** The webhook route must use the **raw** body for verification. This project does that by using the **Web API Request/Response** format for `api/stripe-webhook.js`: it exports named handlers (`POST(request)`, etc.) so Vercel passes a standard `Request` object, and the handler uses `await request.text()` to read the raw body (no parsing). That preserves the exact bytes Stripe signed, so verification succeeds and credits are updated on `checkout.session.completed`.

If you see **"No webhook payload was provided"**: that message is from the Stripe SDK when the payload passed to it is empty. It means the request body was **empty** when it reached the handler (the platform parsed or consumed the body before your code ran). The handler now returns a 400 with a short explanation; ensure the route gets the raw body (e.g. `bodyParser: false` and the default handler reading the stream, or the named `POST(request)` with `request.text()`).

If you still get 400 after deploying, ensure no middleware or config is parsing the webhook request body before it reaches the handler.

---

## Credits checkout

Users can buy extra credits from **Profile → Plan & Credits** (one-time payment, $1/credit). The same webhook endpoint handles `checkout.session.completed` with metadata `type: 'credits'` and adds the purchased credits to `app_users.resume_credits`. No separate Stripe product is required; the app creates a dynamic checkout session via `api/create-credits-checkout-session.js`.

If you set `STRIPE_PRICE_CREDITS` and Stripe returns **"No such price"**, fix the price ID so checkout uses your Dashboard product:

- **Verify first:** Open **GET** `http://localhost:3000/api/verify-stripe-price` (with `vercel dev` running). It checks whether your `STRIPE_PRICE_CREDITS` exists in the Stripe account tied to `STRIPE_SECRET_KEY`. If it returns 404, the price is in a different account or mode.
- **Same Stripe account:** The price must be in the **same** Stripe account as your API key. If you have multiple accounts, copy the Price ID from the account whose key you use (Dashboard → Developers → API keys).
- **Test mode:** With `sk_test_...`, the price must be created in **Test mode** (Dashboard toggle ON). Go to **Product catalog** with Test mode ON → open your Credits product → copy the **Price ID** (starts with `price_`) of the one-time price.
- **Not archived:** In the product’s price list, the price must be **active** (not archived). Archived prices cannot be used for new checkouts.

---

## Checklist

- [ ] Stripe **test** Secret key in `STRIPE_SECRET_KEY`
- [ ] Webhook endpoint added in Stripe (test) with: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
- [ ] Webhook **signing secret** in `STRIPE_WEBHOOK_SECRET`
- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `subscriptions` and `app_users` tables exist in Supabase
- [ ] Test payment with card 4242 4242 4242 4242 and confirm success + plan badge
- [ ] When going live: switch to live Secret key and create a **new** live webhook + live signing secret (same four events)
