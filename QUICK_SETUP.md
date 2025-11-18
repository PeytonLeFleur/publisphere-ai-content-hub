# 🚀 Quick Setup Guide (30 Minutes to Launch)

**Your encryption key:** `e5719971c76556911d333e23fd8c104c28ea62e315ed060fad1136afdc775d93`
⚠️ **SAVE THIS KEY SOMEWHERE SAFE!** You'll need it later.

---

## Step 1: Database Setup (2 minutes)

```bash
# Login to Supabase
supabase login

# Link your project (get project ref from dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

✅ **Verify:** Go to Supabase → Database → Tables. You should see 20+ tables.

---

## Step 2: Set Environment Variables (5 minutes)

Go to: **[Supabase Dashboard → Settings → Edge Functions](https://supabase.com/dashboard/project/_/settings/functions)**

Click **"Add new secret"** for each:

| Name | Value | Where to Get |
|------|-------|--------------|
| `ENCRYPTION_SECRET` | `e5719971c76556911d333e23fd8c104c28ea62e315ed060fad1136afdc775d93` | ✅ Already generated above |
| `OPENAI_API_KEY` | `sk-proj-XXXXX` | [Get from OpenAI](https://platform.openai.com/api-keys) |
| `STRIPE_SECRET_KEY` | `sk_test_XXXXX` | [Get from Stripe](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_XXXXX` | Leave blank for now (add in Step 4) |

✅ **Verify:** You should see 4 secrets listed (STRIPE_WEBHOOK_SECRET can be blank for now)

---

## Step 3: Deploy Edge Functions (5 minutes)

**Option A: Automated (Recommended)**
```bash
# Run the deployment script
./deploy-functions.sh
```

**Option B: Manual**
```bash
# Deploy each function one by one
supabase functions deploy agency-signup
supabase functions deploy client-management
supabase functions deploy generate-content
supabase functions deploy stripe-webhooks
supabase functions deploy super-admin-login
# ... (see deploy-functions.sh for full list)
```

✅ **Verify:** Go to Supabase → Edge Functions. You should see ~25 functions with "Deployed" status.

---

## Step 4: Configure Stripe Webhooks (5 minutes)

1. **Get your webhook URL:**
   - Go to Supabase → Edge Functions → `stripe-webhooks`
   - Copy the function URL (looks like: `https://abc123.supabase.co/functions/v1/stripe-webhooks`)

2. **Add webhook in Stripe:**
   - Go to: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
   - Click **"Add endpoint"**
   - Paste your URL
   - Click **"Select events"** → Choose these 6:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **"Add endpoint"**

3. **Get signing secret:**
   - Click on your new webhook
   - Click **"Reveal"** next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

4. **Add to Supabase:**
   - Go back to: Supabase → Settings → Edge Functions
   - Edit `STRIPE_WEBHOOK_SECRET`
   - Paste the signing secret
   - Click "Save"

✅ **Verify:** Send test webhook from Stripe. Check Supabase → Edge Functions → stripe-webhooks → Logs for success.

---

## Step 5: Deploy Frontend to Vercel (10 minutes)

### Quick Deploy (Click this button):
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PeytonLeFleur/publisphere-ai-content-hub)

### Manual Deploy:

1. **Go to Vercel:** https://vercel.com/new

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select: `PeytonLeFleur/publisphere-ai-content-hub`
   - Click "Import"

3. **Configure Project:**
   - Framework: **Vite** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables:**

   Get these from Supabase → Settings → API:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://yourproject.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` (anon/public key) |

5. **Click "Deploy"**
   - Wait 2-3 minutes for build
   - You'll get a URL like: `publisphere-ai-content-hub.vercel.app`

✅ **Verify:** Visit your Vercel URL. You should see the landing page with no errors.

---

## Step 6: Test Everything (10 minutes)

### Test 1: Super Admin Login
```
1. Go to: https://your-url.vercel.app/super-admin/login
2. Email: plefleur00@gmail.com
3. Password: Titan2022!
4. ✅ Should see analytics dashboard
```

### Test 2: Agency Signup
```
1. Go to: https://your-url.vercel.app/signup/agency
2. Fill out form
3. Check email for verification link
4. Complete onboarding
5. ✅ Should reach agency dashboard
```

### Test 3: Generate Content
```
1. From dashboard, click "Generate Content"
2. Fill out form
3. Click "Generate"
4. ✅ Should see AI-generated content
```

### Test 4: Stripe Billing
```
1. Go to /agency/billing
2. Click "Connect Stripe"
3. Use test mode
4. Create subscription plan
5. ✅ Should see plan created
```

---

## 🎉 You're Live!

If all tests pass, you're ready to launch! 🚀

### Your URLs:
- **Production App:** `https://your-project.vercel.app`
- **Super Admin:** `https://your-project.vercel.app/super-admin/login`
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com

### Next Steps:
1. **Add custom domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your domain
   - Update DNS records

2. **Switch Stripe to live mode**:
   - Get live API keys from Stripe
   - Update `STRIPE_SECRET_KEY` in Supabase
   - Update webhook to use live mode

3. **Invite beta testers**:
   - Share your URL with 5-10 friends
   - Get feedback
   - Fix any bugs

4. **Public launch**:
   - Announce on social media
   - Post on Product Hunt
   - Email your list

---

## 🆘 Troubleshooting

### "Table does not exist" error
**Fix:** Run `supabase db push` again

### Content generation fails
**Fix:** Check `OPENAI_API_KEY` is set correctly in Supabase

### Stripe payments don't work
**Fix:** Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### Can't login to super admin
**Fix:** Check super_admins table exists in Supabase → Database → Tables

### Edge function errors
**Fix:** Check logs in Supabase → Edge Functions → [Function Name] → Logs

---

## 📞 Need Help?

1. Check logs: Supabase → Edge Functions → Logs
2. Check browser console: F12 → Console tab
3. Review error messages carefully
4. Search error in documentation

---

## ✅ Final Checklist

Before announcing launch:

- [ ] Database migrations run successfully
- [ ] All environment variables set
- [ ] Edge functions deployed (25/25)
- [ ] Stripe webhook configured and tested
- [ ] Frontend deployed to Vercel
- [ ] Super admin login works
- [ ] Agency signup works
- [ ] Content generation works
- [ ] Billing flow works
- [ ] No console errors in production
- [ ] SSL certificate active (green padlock)
- [ ] Custom domain configured (optional)

---

**Time to complete:** 30-60 minutes
**Difficulty:** Beginner-friendly
**Cost:** Free (Vercel, Supabase, Stripe test mode)

Let's launch! 🚀
