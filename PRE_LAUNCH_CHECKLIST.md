# PubliSphere Pre-Launch Checklist
**Last Updated**: November 18, 2025

This is your complete checklist before going public with PubliSphere. Follow these steps in order.

---

## 🔴 CRITICAL (Must Complete Before Launch)

### 1. Database Setup

#### Run Database Migrations
```bash
supabase db push
```

This will create all tables including:
- ✅ Core tables (agencies, clients, content_items, etc.)
- ✅ Voice agent tables (twilio_credentials, elevenlabs_credentials, voice_agents, etc.)
- ✅ Service package tables (service_packages, client_package_subscriptions, etc.)
- ✅ Super admin table (super_admins)

**Verify**: Check Supabase dashboard → Table Editor to confirm all tables exist.

---

### 2. Environment Variables

#### Supabase Dashboard (Production)
Set these environment variables in: Supabase Dashboard → Settings → Edge Functions → Environment Variables

**Required Variables**:
```
ENCRYPTION_SECRET=<64-character hex string>
OPENAI_API_KEY=<your OpenAI key for embeddings>
STRIPE_SECRET_KEY=<your Stripe secret key>
STRIPE_WEBHOOK_SECRET=<your Stripe webhook signing secret>
SUPABASE_URL=<your Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service role key>
```

**Generate Encryption Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ CRITICAL**: Keep `ENCRYPTION_SECRET` secure and backed up. Losing this means all encrypted API keys become unrecoverable.

---

### 3. Deploy Edge Functions

#### Deploy All Edge Functions
```bash
# Deploy all functions at once
supabase functions deploy agency-signup
supabase functions deploy client-management
supabase functions deploy generate-content
supabase functions deploy process-jobs
supabase functions deploy process-scheduled-jobs
supabase functions deploy send-notification
supabase functions deploy wordpress-connect
supabase functions deploy wordpress-publish
supabase functions deploy create-subscription-plan
supabase functions deploy create-client-subscription
supabase functions deploy stripe-connect-onboarding
supabase functions deploy stripe-webhooks

# Voice agent functions
supabase functions deploy save-twilio-credentials
supabase functions deploy save-elevenlabs-key
supabase functions deploy provision-phone-number
supabase functions deploy create-voice-agent
supabase functions deploy delete-voice-agent
supabase functions deploy upload-knowledge-file
supabase functions deploy process-knowledge-embeddings
supabase functions deploy twilio-webhook
supabase functions deploy twilio-status-callback
supabase functions deploy get-call-logs

# Service package functions
supabase functions deploy create-service-package
supabase functions deploy subscribe-client-to-package

# Super admin function
supabase functions deploy super-admin-login
```

**Verify**: Each function should return a success message with the deployment URL.

---

### 4. Stripe Configuration

#### A. Connect Your Stripe Account
1. Create/login to Stripe account at https://stripe.com
2. Get your API keys from: Stripe Dashboard → Developers → API keys
3. Add to Supabase environment variables:
   - `STRIPE_SECRET_KEY` (starts with `sk_live_` for production)

#### B. Configure Stripe Webhooks
1. Go to: Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhooks`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add to Supabase: `STRIPE_WEBHOOK_SECRET`

**Verify**: Send a test webhook from Stripe dashboard and check edge function logs.

---

### 5. Twilio Setup (For Voice Agents)

#### If Agencies Will Use Voice Agents:
1. Each agency needs their own Twilio account (BYOK model)
2. Agencies will enter credentials in `/voice-agents` → API Setup tab
3. Credentials are encrypted before storage

**No action required by you** - agencies configure this themselves.

---

### 6. ElevenLabs Setup (For Voice Agents)

#### If Agencies Will Use Voice Agents:
1. Each agency needs their own ElevenLabs account (BYOK model)
2. Agencies will enter API key in `/voice-agents` → API Setup tab
3. API keys are encrypted before storage

**No action required by you** - agencies configure this themselves.

---

### 7. Domain & Hosting

#### Deploy Frontend (Choose One)

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: Netlify**
1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

**Option C: Your Own Server**
```bash
npm run build
# Upload dist/ folder to your server
```

#### Configure Custom Domain
1. Add domain to hosting provider (Vercel/Netlify)
2. Update DNS records:
   - A record or CNAME pointing to hosting provider
3. Enable SSL (automatic with Vercel/Netlify)

**Update Environment Variables**:
After deployment, update your `.env` or hosting environment variables:
```
VITE_SUPABASE_URL=<your Supabase URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anon key>
```

---

## 🟡 HIGH PRIORITY (Strongly Recommended)

### 8. Email Configuration

#### Supabase Email Templates
1. Go to: Supabase Dashboard → Authentication → Email Templates
2. Customize:
   - Welcome email
   - Password reset email
   - Email confirmation
3. Set "From" email to your domain

#### Optional: Custom SMTP
For branded emails, configure custom SMTP in Supabase Auth settings.

---

### 9. Set Up Super Admin Access

#### Access Super Admin Dashboard
1. Navigate to `https://yourdomain.com/super-admin/login`
2. Login with:
   - Email: `plefleur00@gmail.com`
   - Password: `Titan2022!`

#### Change Password (Recommended)
After first login, consider changing the super admin password:
1. Run SQL in Supabase:
```sql
UPDATE super_admins
SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf', 10))
WHERE email = 'plefleur00@gmail.com';
```

---

### 10. Test Critical User Flows

#### Agency Onboarding Flow
1. ✅ Sign up as agency at `/signup/agency`
2. ✅ Complete onboarding at `/onboarding`
3. ✅ Configure Stripe in billing settings
4. ✅ Add a test client at `/clients/new`
5. ✅ Generate content for test client
6. ✅ Verify content appears in library

#### Client Subscription Flow
1. ✅ Create a service package at `/service-packages`
2. ✅ Subscribe test client to package
3. ✅ Verify Stripe payment intent created
4. ✅ Check subscription appears in client view

#### Voice Agent Flow (If Using)
1. ✅ Configure Twilio credentials at `/voice-agents`
2. ✅ Configure ElevenLabs at `/voice-agents`
3. ✅ Provision phone number
4. ✅ Create voice agent for test client
5. ✅ Upload knowledge base file
6. ✅ Test call to provisioned number

---

### 11. Security Hardening

#### Enable RLS Verification
```sql
-- Verify ALL tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Should return 0 rows
```

#### Audit RLS Policies
```sql
-- Check all RLS policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

#### Test Multi-Tenant Isolation
1. Create two test agency accounts
2. Verify Agency A cannot see Agency B's clients
3. Verify Agency A cannot access Agency B's API keys

---

### 12. Monitoring & Alerts

#### Set Up Error Tracking
Options:
- **Sentry** (recommended): https://sentry.io
- **LogRocket**: https://logrocket.com
- **Rollbar**: https://rollbar.com

**Installation**:
```bash
npm install @sentry/react
```

Add to `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

#### Set Up Uptime Monitoring
Options:
- **Better Uptime**: https://betteruptime.com
- **UptimeRobot**: https://uptimerobot.com
- **Pingdom**: https://pingdom.com

Monitor these endpoints:
- `https://yourdomain.com` (main site)
- `https://<supabase>.supabase.co/functions/v1/health` (if you create a health check)

---

### 13. Analytics Setup

#### Add Analytics Tracking
**Option A: PostHog (Recommended for SaaS)**
```bash
npm install posthog-js
```

**Option B: Google Analytics**
```bash
npm install react-ga4
```

**Option C: Mixpanel**
```bash
npm install mixpanel-browser
```

Track key events:
- Agency signup
- Client creation
- Content generation
- Subscription purchase
- Voice agent creation

---

## 🟢 NICE TO HAVE (Post-Launch)

### 14. Performance Optimization

#### Enable Caching
- Configure CDN for static assets
- Enable browser caching headers
- Optimize images (WebP format)

#### Bundle Analysis
```bash
npm run build -- --mode production
# Analyze bundle size
npx vite-bundle-visualizer
```

---

### 15. Backup Strategy

#### Database Backups
Supabase provides automatic daily backups (Pro plan).

**Manual Backup**:
```bash
# Export full database
pg_dump -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres > backup.sql
```

**Schedule Weekly Backups**:
- Set up automated backups to S3/Google Cloud Storage
- Test restoration process

---

### 16. Documentation

#### Create User Documentation
- Agency onboarding guide
- Voice agent setup tutorial
- Service package creation guide
- Billing configuration steps

#### Create Internal Documentation
- Architecture overview
- Database schema diagram
- API endpoint documentation
- Deployment process

---

### 17. Legal & Compliance

#### Terms of Service
- Update `/terms` page with your actual terms
- Consult with lawyer for SaaS terms

#### Privacy Policy
- Update `/privacy` page with your actual privacy policy
- GDPR compliance if serving EU customers
- CCPA compliance if serving California customers

#### Cookie Consent
Add cookie consent banner if using analytics:
```bash
npm install @cookieyes/cookie-consent
```

---

### 18. Load Testing

#### Test with Multiple Users
Use tools like:
- **k6**: https://k6.io
- **Artillery**: https://artillery.io
- **Locust**: https://locust.io

Test scenarios:
- 100 concurrent agencies
- 1000 concurrent content generations
- 500 concurrent voice calls

---

## 📋 Quick Launch Checklist

```
Pre-Launch Day:
[ ] Database migrations run
[ ] All edge functions deployed
[ ] Environment variables set
[ ] Stripe connected & webhooks configured
[ ] Domain configured with SSL
[ ] Super admin access verified
[ ] Test agency signup → billing → content generation flow
[ ] Error monitoring enabled
[ ] Uptime monitoring enabled
[ ] Backup strategy in place

Launch Day:
[ ] Test all critical flows one more time
[ ] Monitor error logs closely
[ ] Have support team ready
[ ] Post announcement on social media
[ ] Send emails to beta testers/early users

Post-Launch (Week 1):
[ ] Monitor performance metrics
[ ] Check error rates daily
[ ] Gather user feedback
[ ] Fix any critical bugs immediately
[ ] Optimize based on usage patterns
```

---

## 🆘 Emergency Contacts

**Supabase Support**: support@supabase.io
**Stripe Support**: https://support.stripe.com
**Your Development Team**: [Add contact info]

---

## 📊 Success Metrics to Track

1. **User Acquisition**
   - Agency signups per day
   - Conversion rate (visitor → signup)

2. **Engagement**
   - Active agencies (monthly)
   - Content generations per agency
   - Average session duration

3. **Revenue**
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - ARPU (Average Revenue Per User)

4. **Technical**
   - Uptime percentage (aim for 99.9%)
   - Average response time
   - Error rate (aim for <0.1%)

---

## 🎯 You're Ready When...

✅ All edge functions are deployed and tested
✅ Database is fully migrated with RLS policies
✅ Stripe is connected and webhooks are working
✅ Domain is live with SSL certificate
✅ Super admin dashboard is accessible
✅ At least one full user flow tested end-to-end
✅ Error monitoring is capturing errors
✅ Uptime monitoring is active
✅ You can onboard a real paying customer

---

## 🚀 Final Notes

**The platform is production-ready code-wise.** The main tasks are infrastructure setup:
1. Deploy edge functions (15 minutes)
2. Configure Stripe (10 minutes)
3. Set environment variables (5 minutes)
4. Deploy frontend (10 minutes)
5. Test everything (30 minutes)

**Total setup time: ~1-2 hours**

After that, you're live! 🎉

---

Generated by Claude Code | November 18, 2025
