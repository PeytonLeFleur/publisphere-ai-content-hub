# Agency Billing System - Complete Guide

**Status**: ✅ COMPLETE - Full Stripe Connect Integration

---

## Overview

Publisphere now includes a **complete agency billing system** that allows agencies to:

- ✅ **Connect their own Stripe account** (Stripe Connect)
- ✅ **Create custom subscription plans** with their own pricing
- ✅ **Bill clients directly** through Stripe Checkout
- ✅ **Track revenue and subscriptions** in real-time
- ✅ **Control API usage** (agencies provide Claude API keys, not clients)
- ✅ **Automate billing** with recurring subscriptions

**Key Change**: Removed BYOK (Bring Your Own Key) model. Agencies now provide the Claude API key and bill clients for usage through their own pricing.

---

## How It Works

### 1. Agency Setup

1. **Agency signs up** for Publisphere ($147 lifetime)
2. **Agency connects Stripe account** via Stripe Connect
3. **Agency creates subscription plans** (e.g., "Basic $99/mo", "Pro $199/mo")
4. **Agency adds Claude API key** (encrypted at agency level)

### 2. Client Onboarding

1. **Agency creates client account**
2. **Agency subscribes client** to a plan
3. **Client receives Stripe Checkout link**
4. **Client pays** via Stripe (money goes to agency's Stripe account)
5. **Client gets access** to content generation (using agency's Claude key)

### 3. Monthly Billing

1. **Stripe automatically charges clients** on billing date
2. **Webhooks update subscription status** in Publisphere
3. **Usage limits tracked** (posts per month)
4. **Agency sees revenue** in billing dashboard

---

## Database Schema

### New Tables

#### `subscription_plans`
Agencies define their own subscription pricing:
- `name` - Plan name (e.g., "Professional Plan")
- `price_monthly` - Monthly price in dollars
- `max_posts_per_month` - Usage limit
- `stripe_price_id` - Stripe Price ID
- `is_active` - Enable/disable plan

#### `client_subscriptions`
Tracks active client subscriptions:
- `client_id` - Which client
- `plan_id` - Which plan they're on
- `stripe_subscription_id` - Stripe subscription
- `status` - active, past_due, canceled, etc.
- `posts_used_this_month` - Usage tracking
- `current_period_end` - Next billing date

#### `subscription_payments`
Payment history for accounting:
- `amount` - Payment amount
- `status` - succeeded, failed, refunded
- `stripe_invoice_id` - Stripe invoice
- `payment_date` - When paid

#### `billing_events`
Stripe webhook event log:
- `event_type` - subscription.created, payment.succeeded, etc.
- `event_data` - Full Stripe event data

### Updated Tables

#### `agencies`
Added Stripe Connect fields:
- `stripe_account_id` - Connected Stripe account
- `stripe_onboarding_completed` - Setup complete
- `claude_api_key_encrypted` - Agency's Claude API key (used for all clients)

#### `clients`
Removed BYOK fields:
- ❌ Removed `anthropic_api_key_encrypted`
- ❌ Removed `openai_api_key_encrypted`
- ✅ Added `stripe_customer_id`

---

## Edge Functions

### `/stripe-connect-onboarding`
**Purpose**: Initiates Stripe Connect for agencies

**Request**:
```typescript
POST /functions/v1/stripe-connect-onboarding
Authorization: Bearer <agency_jwt_token>
```

**Response**:
```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/...",
  "account_id": "acct_..."
}
```

**Frontend Usage**:
```typescript
const { data } = await supabase.functions.invoke('stripe-connect-onboarding');
window.location.href = data.url; // Redirect to Stripe onboarding
```

---

### `/create-subscription-plan`
**Purpose**: Creates a new subscription plan

**Request**:
```typescript
POST /functions/v1/create-subscription-plan
Authorization: Bearer <agency_jwt_token>
Content-Type: application/json

{
  "name": "Professional Plan",
  "description": "For growing businesses",
  "priceMonthly": 199,
  "currency": "usd",
  "billingInterval": "month",
  "maxPostsPerMonth": 75,
  "features": ["wordpress", "gmb", "social"],
  "isDefault": false
}
```

**Response**:
```json
{
  "success": true,
  "plan": {
    "id": "uuid",
    "name": "Professional Plan",
    "stripe_price_id": "price_...",
    "stripe_product_id": "prod_..."
  }
}
```

---

### `/create-client-subscription`
**Purpose**: Subscribes a client to a plan

**Request**:
```typescript
POST /functions/v1/create-client-subscription
Authorization: Bearer <agency_jwt_token>
Content-Type: application/json

{
  "clientId": "client_uuid",
  "planId": "plan_uuid",
  "trialDays": 14
}
```

**Response**:
```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/...",
  "subscription_id": "sub_uuid",
  "session_id": "cs_..."
}
```

**Frontend Usage**:
```typescript
const { data } = await supabase.functions.invoke('create-client-subscription', {
  body: { clientId, planId, trialDays: 14 }
});
window.location.href = data.checkout_url; // Redirect to Stripe Checkout
```

---

### `/stripe-webhooks`
**Purpose**: Handles Stripe webhook events

**Events Handled**:
- `checkout.session.completed` - Subscription activated
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment received
- `invoice.payment_failed` - Payment failed
- `account.updated` - Stripe account status changed

**Setup**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhooks`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.*`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `account.updated`
4. Copy webhook signing secret to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Frontend Pages

### Agency Billing Dashboard
**Route**: `/agency/billing`

**Features**:
- Stripe Connect onboarding
- Revenue metrics (MRR, total revenue, active subs)
- Create subscription plans
- Manage existing plans
- View plan performance

**UI Components**:
- Revenue stat cards
- Plan cards with active subscriptions
- Create plan modal
- Stripe Connect status banner

---

### Client Management (Updated)
**Route**: `/clients`

**New Features**:
- Subscribe client button
- View subscription status
- Cancel subscription
- View payment history

**Subscription Status Badges**:
- 🟢 Active
- 🟡 Trialing
- 🔴 Past Due
- ⚫ Canceled

---

## Usage Flow Examples

### Example 1: Agency Sets Up Billing

```typescript
// 1. Agency visits /agency/billing
// 2. Clicks "Connect Stripe Account"
const { data } = await supabase.functions.invoke('stripe-connect-onboarding');
window.location.href = data.url;

// 3. Completes Stripe onboarding
// 4. Redirected back to /agency/billing?success=true

// 5. Creates first subscription plan
const { data: plan } = await supabase.functions.invoke('create-subscription-plan', {
  body: {
    name: "Starter Plan",
    priceMonthly: 99,
    maxPostsPerMonth: 25
  }
});

// Plan is now visible in billing dashboard
```

---

### Example 2: Agency Subscribes a Client

```typescript
// 1. Agency goes to client management
// 2. Clicks "Subscribe" on a client

// 3. Create subscription
const { data } = await supabase.functions.invoke('create-client-subscription', {
  body: {
    clientId: "client_uuid",
    planId: "plan_uuid",
    trialDays: 14 // Optional trial
  }
});

// 4. Client receives checkout link (email or dashboard)
// Client visits: data.checkout_url

// 5. Client completes payment on Stripe Checkout
// 6. Stripe sends webhook: checkout.session.completed
// 7. Subscription activated in database
// 8. Client can now generate content
```

---

### Example 3: Monthly Billing Cycle

```typescript
// Day 1: Subscription created
// - Status: "trialing" (if trial) or "active"
// - posts_used_this_month: 0

// Days 2-30: Client uses the service
// - Each content generation increments posts_used_this_month
// - Check limit before generating:

const canGenerate = await supabase.rpc('increment_post_usage', {
  client_uuid: clientId
});

if (!canGenerate) {
  throw new Error('Monthly post limit reached');
}

// Day 30: Stripe charges the client
// - Webhook: invoice.payment_succeeded
// - Payment recorded in subscription_payments
// - Subscription renewed

// Day 31 (new month):
// - Cron job runs: reset_monthly_post_usage()
// - posts_used_this_month reset to 0
```

---

## Database Functions

### `reset_monthly_post_usage()`
**Purpose**: Reset usage counters (run via cron on 1st of month)

```sql
SELECT reset_monthly_post_usage();
```

**Cron Setup** (in Supabase Dashboard):
```sql
SELECT cron.schedule(
  'reset-monthly-usage',
  '0 0 1 * *', -- Run at midnight on the 1st of every month
  $$SELECT reset_monthly_post_usage();$$
);
```

---

### `increment_post_usage(client_uuid UUID)`
**Purpose**: Increment usage and check limit

```typescript
const { data } = await supabase.rpc('increment_post_usage', {
  client_uuid: clientId
});

if (!data) {
  // Limit reached
  toast.error('Monthly post limit reached. Please upgrade your plan.');
  return;
}

// Continue with content generation
```

---

### `get_agency_revenue_stats(agency_uuid UUID)`
**Purpose**: Get revenue metrics for dashboard

```typescript
const { data: stats } = await supabase.rpc('get_agency_revenue_stats', {
  agency_uuid: agencyId
});

console.log(stats);
// {
//   total_revenue: 15000,
//   monthly_recurring_revenue: 2500,
//   active_subscriptions: 12,
//   total_clients: 15,
//   successful_payments: 48,
//   failed_payments: 2
// }
```

---

## Environment Variables

### Required for Billing

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_...

# App URL for redirects
APP_URL=http://localhost:8080  # or https://yourdomain.com
```

### Set in Supabase Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=http://localhost:8080
```

---

## Stripe Connect Setup

### 1. Enable Stripe Connect

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Connect** → **Settings**
3. Enable **Connect**
4. Set **Brand name**: "Publisphere"
5. Set **Brand icon**: Upload logo
6. Configure **OAuth settings**:
   - Redirect URI: `https://your-app.com/agency/billing`

### 2. Connect Options

Publisphere uses **Standard Connect** accounts:
- Agencies get their own Stripe dashboard
- Agencies manage their own payouts
- Publisphere doesn't handle funds
- No platform fees (agencies keep 100%)

---

## Revenue Model

### How Agencies Make Money

**Example Pricing**:
- Agency's Claude API cost: ~$0.50 per blog post
- Agency's subscription price: $99/month for 25 posts
- Agency's cost: $12.50/month (25 posts × $0.50)
- **Agency's profit: $86.50/month per client**

**With 10 clients**:
- Revenue: $990/month
- Costs: $125/month (Claude API)
- **Profit: $865/month**

**With 50 clients**:
- Revenue: $4,950/month
- Costs: $625/month
- **Profit: $4,325/month**

---

## Payment Flow Diagram

```
┌─────────────────┐
│  Agency Creates │
│      Plan       │
│   ($99/month)   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Agency Adds    │
│     Client      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Create Stripe   │
│   Checkout      │
│    Session      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Client Pays    │
│  via Stripe     │
│   Checkout      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Stripe Webhook  │
│    checkout     │
│    .session     │
│   .completed    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Subscription   │
│    Activated    │
│   in Database   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Client Can     │
│    Generate     │
│    Content      │
└─────────────────┘
         │
         │ (Monthly billing cycle)
         v
┌─────────────────┐
│  Stripe Auto    │
│    Charges      │
│     Client      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Webhook:       │
│   invoice       │
│   .payment      │
│   .succeeded    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Payment        │
│  Recorded &     │
│  Usage Reset    │
└─────────────────┘
```

---

## Testing

### Test Mode Setup

1. Use Stripe test keys: `sk_test_...` and `pk_test_...`
2. Use test webhook secret: `whsec_test_...`
3. Test cards:
   - Success: `4242 4242 4242 4242`
   - Declined: `4000 0000 0000 0002`
   - Requires auth: `4000 0025 0000 3155`

### Test Stripe Connect

1. Go to `/agency/billing`
2. Click "Connect Stripe Account"
3. In test mode, you'll see "Skip this account form" link
4. Click to skip and instantly connect

### Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local Supabase
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhooks
```

---

## Security

### PCI Compliance
- ✅ No card data touches Publisphere servers
- ✅ All payments handled by Stripe Checkout
- ✅ PCI DSS compliant by default

### API Key Security
- ✅ Claude API keys encrypted (AES-256-GCM)
- ✅ Keys never exposed to clients
- ✅ Decrypted only in secure edge functions

### Stripe Security
- ✅ Webhook signature verification
- ✅ Service role keys for database updates
- ✅ RLS policies prevent unauthorized access

---

## Troubleshooting

### Stripe Connect Not Working

**Problem**: "Please complete Stripe Connect onboarding first"

**Solution**:
1. Check `agencies.stripe_account_id` is set
2. Check `agencies.stripe_onboarding_completed = true`
3. Verify webhook `account.updated` was received
4. Re-run onboarding if needed

---

### Webhooks Not Received

**Problem**: Subscription stays in "pending" status

**Solution**:
1. Check webhook endpoint in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check webhook logs in Stripe Dashboard
4. Test webhook: `stripe trigger checkout.session.completed`

---

### Payment Failed

**Problem**: Client payment declined

**Result**:
- Subscription status → `past_due`
- Stripe retries payment (smart retries)
- Email sent to client
- After 4 attempts, subscription → `unpaid`

**Agency Action**:
- View failed payment in billing dashboard
- Contact client to update payment method
- Client updates card in Stripe billing portal

---

## Next Steps

### Post-Launch Enhancements

1. **Usage Analytics** - Show clients their usage stats
2. **Overage Billing** - Charge for posts over limit
3. **Annual Plans** - Discounted yearly subscriptions
4. **Metered Billing** - Pay per post instead of fixed monthly
5. **Referral Program** - Agencies earn from referrals
6. **Tax Handling** - Stripe Tax integration
7. **Invoicing** - Custom PDF invoices

---

## Summary

✅ **Complete Stripe Connect integration**
✅ **Agencies control their own billing**
✅ **Subscription management with limits**
✅ **Automated recurring payments**
✅ **Real-time webhook processing**
✅ **Revenue tracking dashboard**
✅ **No BYOK - agencies provide Claude API**
✅ **100% profit to agencies (no platform fees)**

**This billing system transforms Publisphere into a true white-label SaaS platform where agencies can build profitable content automation businesses.**

---

**Last Updated**: November 17, 2025
**Status**: Production Ready ✨
**Migration Required**: Yes (`20251117230000_add_agency_billing.sql`)
