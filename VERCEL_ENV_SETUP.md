# Vercel Environment Variables Setup

This guide will help you configure Supabase environment variables for your Vercel deployment.

## Required Environment Variables

Your app needs the following environment variables in Vercel:

**Option 1 (Recommended):** Use with `VITE_` prefix (automatically available to client-side)
1. `VITE_SUPABASE_URL` - Your Supabase project URL
2. `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

**Option 2:** Use without `VITE_` prefix (injected at build time)
1. `SUPABASE_URL` - Your Supabase project URL
2. `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

**Note:** The Supabase anon key is safe to expose to the browser - it's designed for client-side use. The `VITE_` prefix is just Vite's way of marking variables as safe for client-side access.

## How to Set Environment Variables in Vercel

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create one if you haven't)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon/public key** → This is your `VITE_SUPABASE_ANON_KEY`

### Step 2: Add Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`resume-tailor` or similar)
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add the following variables:

   **Variable 1:**
   - **Name:** `SUPABASE_URL` (or `VITE_SUPABASE_URL` if you prefer)
   - **Value:** `https://your-project-id.supabase.co` (your actual Supabase URL)
   - **Environment:** Select all environments (Production, Preview, Development)

   **Variable 2:**
   - **Name:** `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY` if you prefer)
   - **Value:** `your-anon-key-here` (your actual Supabase anon key)
   - **Environment:** Select all environments (Production, Preview, Development)

   **Note:** The code supports both naming conventions. If you use `SUPABASE_URL` and `SUPABASE_ANON_KEY` (without `VITE_` prefix), they will be injected at build time. If you use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, they will be available at runtime.

6. Click **Save** for each variable

### Step 3: Redeploy Your Application

After adding the environment variables:

1. Go to the **Deployments** tab in Vercel
2. Click the **⋯** (three dots) menu on your latest deployment
3. Click **Redeploy**
4. Or make a new commit and push to trigger a new deployment

**Important:** Environment variables are only available after a new deployment. Existing deployments won't have access to newly added variables.

## Verify the Configuration

After redeploying:

1. Visit your deployed site
2. Try to access the sign-in page
3. The "Supabase is not configured" error should no longer appear
4. You should be able to sign in/sign up

## Optional: Set Environment Variables Locally

For local development, create a `.env` file in your project root:

**Option 1 (with VITE_ prefix):**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Option 2 (without VITE_ prefix):**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

The code supports both formats.

**Note:** Never commit your `.env` file to Git. It should already be in `.gitignore`.

## Troubleshooting

### Environment Variables Not Working After Deployment

- Make sure you selected all environments (Production, Preview, Development) when adding variables
- Verify the variable names match what you set (either `SUPABASE_URL`/`SUPABASE_ANON_KEY` or `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`) - they are case-sensitive
- Redeploy your application after adding variables
- Check the Vercel deployment logs for any errors

### Still Seeing "Supabase is not configured" Error

1. Check your browser's developer console for errors
2. Verify the environment variables in Vercel Dashboard → Settings → Environment Variables
3. Make sure you redeployed after adding the variables
4. Verify your Supabase credentials are correct

### Testing Locally

If you want to test with environment variables locally:

1. Create a `.env` file in the project root
2. Add your Supabase credentials
3. Restart your dev server (`npm run dev`)

## Additional Notes

- The `VITE_` prefix is required for Vite to expose these variables to the client-side code
- The anon key is safe to expose to the browser (it's designed for client-side use)
- Never commit your `.env` file with actual credentials to version control

