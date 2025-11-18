# Publisphere Project Issues Audit

## Critical Issues

### 1. Missing Routes (CRITICAL)
**Files:** `src/App.tsx`, `src/pages/ClientManagement.tsx`
**Lines:** ClientManagement.tsx:333, 547, 559, 593

**Issue:** Navigation links point to routes that don't exist:
- `/clients/new` - No page component exists
- `/clients/:id` - No page component exists
- `/clients/:id/edit` - No page component exists

**Impact:** Clicking "Add Client", "View", or "Edit" buttons in Client Management will show 404 page

**Suggested Fix:**
```typescript
// Create these new page files:
// - src/pages/ClientNew.tsx
// - src/pages/ClientView.tsx
// - src/pages/ClientEdit.tsx

// Add routes to App.tsx:
<Route path="/clients/new" element={<ClientNew />} />
<Route path="/clients/:id" element={<ClientView />} />
<Route path="/clients/:id/edit" element={<ClientEdit />} />
```

---

### 2. Missing Database Table - `activity_logs` (HIGH)
**File:** `supabase/functions/create-subscription-plan/index.ts`
**Line:** 143-148

**Issue:** Edge function tries to insert into `activity_logs` table which doesn't exist in any migration

```typescript
await supabaseClient
  .from('activity_logs')  // ❌ Table doesn't exist
  .insert({...});
```

**Impact:** Subscription plan creation will fail with database error

**Suggested Fix:**
Create migration to add activity_logs table:
```sql
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

Or remove the activity logging code if not needed.

---

### 3. Conflicting API Key Model (HIGH)
**File:** `src/pages/ApiKeysSettings.tsx`
**Lines:** 24-49

**Issue:** Page shows Anthropic and OpenAI API keys for clients to configure, but according to `BILLING_SYSTEM.md` and migration file, the new model is:
- **Agencies** provide the Claude API key (stored encrypted in `agencies` table)
- **Clients** should NOT provide API keys

**Current UI:**
```typescript
{
  service: 'anthropic',
  name: 'Anthropic (Claude)',
  description: 'Required for AI content generation using Claude models',
  required: true,  // ❌ Misleading - clients don't need this
}
```

**Impact:** Confuses clients, contradicts billing system architecture

**Suggested Fix:**
Either:
1. Remove this page entirely for clients (recommended)
2. Or repurpose it for agencies only to configure their Claude API key
3. Update copy to clarify these are for personal use/testing, not required for content generation

---

### 4. Foreign Key Relationship Issue (MEDIUM)
**File:** `src/pages/AgencyBilling.tsx`, `src/pages/ClientManagement.tsx`
**Lines:** AgencyBilling.tsx:90-97, ClientManagement.tsx:130-140

**Issue:** Nested select query may fail if foreign key isn't named correctly:

```typescript
client_subscriptions!subscription_plans_id_fkey (  // May not match actual FK name
  subscription_plans (...)
)
```

**Impact:** May fail to load subscription data with relationship

**Suggested Fix:**
Check actual foreign key name in database and use proper syntax:
```typescript
client_subscriptions (
  *,
  subscription_plans:plan_id (
    name,
    price_monthly
  )
)
```

---

## High Priority Issues

### 5. Missing Environment Variables (HIGH)
**Files:** `supabase/functions/send-notification/index.ts`, `supabase/functions/process-scheduled-jobs/index.ts`

**Issue:** Edge functions reference environment variables not documented in `.env.example`:
- `RESEND_API_KEY` (send-notification/index.ts:4)
- `CRON_SECRET` (process-scheduled-jobs/index.ts:18)

**Impact:** Functions will fail when deployed without these secrets

**Suggested Fix:**
Add to `.env.example`:
```bash
# Email notifications (Optional - required for send-notification function)
RESEND_API_KEY=re_...

# Cron job security (Optional - for scheduled jobs)
CRON_SECRET=your_random_secret_string
```

---

### 6. Missing Subscription Success/Cancel Pages (MEDIUM)
**File:** `supabase/functions/create-client-subscription/index.ts`
**Lines:** 144-145

**Issue:** Stripe Checkout redirects to routes that don't exist:
```typescript
success_url: `${Deno.env.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${Deno.env.get('APP_URL')}/subscription/canceled`,
```

**Impact:** After completing/canceling Stripe payment, users see 404 page

**Suggested Fix:**
Create pages:
- `src/pages/SubscriptionSuccess.tsx`
- `src/pages/SubscriptionCanceled.tsx`

Add routes to App.tsx:
```typescript
<Route path="/subscription/success" element={<SubscriptionSuccess />} />
<Route path="/subscription/canceled" element={<SubscriptionCanceled />} />
```

---

## Medium Priority Issues

### 7. Unused Route in App.tsx (LOW)
**File:** `src/App.tsx`
**Line:** 18

**Issue:** `ContentGeneration` component is imported but no route uses it:
```typescript
const ContentGeneration = lazy(() => import("./pages/ContentGeneration"));
// ❌ No <Route path="/content-generation" element={<ContentGeneration />} />
```

**Impact:** Dead code, slight performance impact

**Suggested Fix:**
Either:
1. Remove the import if not needed
2. Or add the route if it should be accessible

---

### 8. Inconsistent App URLs (MEDIUM)
**File:** `.env.example`
**Lines:** 29, 54

**Issue:** Two different APP_URL values:
```bash
APP_URL=http://localhost:8080     # For edge functions
VITE_APP_URL=http://localhost:5173  # For frontend
```

**Impact:** Vite dev server runs on :5173 but edge functions expect :8080, causing redirect mismatches

**Suggested Fix:**
Standardize to one port (typically :5173 for local dev):
```bash
APP_URL=http://localhost:5173
VITE_APP_URL=http://localhost:5173
```

---

### 9. Missing Claude API Key Storage UI (MEDIUM)
**File:** Missing implementation

**Issue:** Agencies need a UI to securely configure their Claude API key (as per new billing model), but no interface exists for this

**Current:** ApiKeysSettings.tsx is for clients and shows wrong keys
**Needed:** Agency-level API key configuration page

**Suggested Fix:**
Create `src/pages/AgencyApiSettings.tsx` with:
- Secure input for Claude API key
- Encryption before storage
- Test connection button
- Save to `agencies.claude_api_key_encrypted`

Add route: `/agency/settings/api-keys`

---

### 10. Migration Dependency (MEDIUM)
**File:** `supabase/migrations/20251117230000_add_agency_billing.sql`
**Lines:** 5-13, 131-137

**Issue:** Migration assumes `agencies` and `clients` tables exist with specific columns. If run out of order or on fresh DB, will fail.

**Current:**
```sql
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
-- ...
```

**Suggested Fix:**
Add comment at top of migration:
```sql
-- REQUIRES: agencies and clients tables to exist
-- Dependencies: Run base schema migrations first
```

Or use CREATE TABLE IF NOT EXISTS with full schema

---

## Low Priority Issues

### 11. Mock Data in ClientManagement (LOW)
**File:** `src/pages/ClientManagement.tsx`
**Lines:** 34-80

**Issue:** File contains mock client data that's no longer used but still present:
```typescript
const mockClients = [
  {
    id: 1,
    name: "Tech Startup Inc",
    // ... ❌ Not used anywhere
  }
];
```

**Impact:** Code clutter, confusion

**Suggested Fix:** Remove mock data array

---

### 12. Hardcoded Agency Branding in ApiKeysSettings (LOW)
**File:** `src/pages/ApiKeysSettings.tsx`
**Line:** 137

**Issue:**
```typescript
<Navbar agencyBranding={{ name: "Demo Agency", primary_color: "#3B82F6" }} />
```

**Impact:** Shows "Demo Agency" instead of real agency branding

**Suggested Fix:**
```typescript
import { useAgencyBranding } from "@/contexts/AgencyBrandingContext";

const ApiKeysSettings = () => {
  const { branding } = useAgencyBranding();

  return (
    <Navbar agencyBranding={branding} />
  );
};
```

---

### 13. Confusing Button Labels in Client Table (LOW)
**File:** `src/pages/ClientManagement.tsx`
**Lines:** 542-546

**Issue:** Edit button shows only an icon, no text, might be confusing

```typescript
<Button variant="ghost" size="sm" className="gap-2">
  <Edit className="h-4 w-4" />
  {/* No text label */}
</Button>
```

**Suggested Fix:** Add screen reader text or tooltip

---

### 14. Missing Loading States (LOW)
**File:** `src/pages/AgencyBilling.tsx`

**Issue:** Create plan modal doesn't disable inputs during submission

**Impact:** Users might edit form while submission is in progress

**Already Fixed:** Form is properly disabled with `disabled={isCreatingPlan}`

---

## Documentation Issues

### 15. .env.example Missing Production Notes (LOW)

**Issue:** No guidance on production environment variables

**Suggested Fix:**
Add section:
```bash
# ===================================
# PRODUCTION DEPLOYMENT
# ===================================
# For production:
# 1. Use live Stripe keys (sk_live_..., pk_live_...)
# 2. Set APP_URL to your domain (https://yourdomain.com)
# 3. Configure webhook endpoint in Stripe Dashboard
# 4. Never commit .env file to git
```

---

## Summary

**Total Issues Found:** 15

**Breakdown:**
- Critical: 4
- High: 2
- Medium: 5
- Low: 4

**Immediate Action Required:**
1. Create missing client management pages (/clients/new, /clients/:id, /clients/:id/edit)
2. Fix or remove activity_logs table reference
3. Resolve API key settings page conflict with new billing model
4. Create subscription success/cancel pages
5. Add missing environment variables to .env.example

**Can Be Deferred:**
- Mock data cleanup
- Minor UI improvements
- Documentation enhancements
