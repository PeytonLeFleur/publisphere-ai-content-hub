# Deployment Scripts Guide

This directory contains automated scripts to make deployment easier.

---

## 📜 Available Scripts

### 1. `verify-setup.sh` - Pre-flight Check
**What it does:** Checks if your local environment is ready for deployment

**When to run:** Before starting deployment

**How to run:**
```bash
./verify-setup.sh
```

**What it checks:**
- ✅ Supabase CLI installed
- ✅ Node.js installed
- ✅ Project linked to Supabase
- ✅ All migration files exist
- ✅ Edge function directories exist
- ✅ Required config files present

**Output:**
- Green ✅ = Check passed
- Yellow ⚠️ = Warning (non-critical)
- Red ❌ = Error (must fix)

---

### 2. `deploy-functions.sh` - Deploy All Edge Functions
**What it does:** Deploys all 25 edge functions to Supabase in one command

**When to run:** After setting environment variables in Supabase

**How to run:**
```bash
./deploy-functions.sh
```

**What it does:**
1. Checks Supabase CLI is installed
2. Verifies you're logged in
3. Deploys each function one by one
4. Shows progress for each function
5. Provides summary at the end

**Output:**
- Shows deployment progress: `[5/25] Deploying function-name...`
- ✅ for successful deployments
- ❌ for failed deployments
- Final summary with success/failure count

**Time:** ~5 minutes for all 25 functions

---

## 🚀 Quick Deployment Workflow

Follow these steps in order:

### Step 1: Verify Setup
```bash
./verify-setup.sh
```
Fix any errors before proceeding.

### Step 2: Push Database
```bash
supabase db push
```

### Step 3: Set Environment Variables
Go to Supabase Dashboard → Settings → Edge Functions

Add these secrets:
- `ENCRYPTION_SECRET` (see `.env.production.template`)
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (add after webhook setup)

### Step 4: Deploy Functions
```bash
./deploy-functions.sh
```

### Step 5: Verify Deployment
Check Supabase Dashboard → Edge Functions

All should show "Deployed" status.

---

## 📋 Environment Variables

See `.env.production.template` for:
- Required variables
- Where to get each value
- Example values
- Setup instructions

**Important:**
1. Never commit actual `.env.production` file
2. Save your `ENCRYPTION_SECRET` somewhere safe
3. Use test keys for testing, live keys for production

---

## 🔍 Troubleshooting

### Script won't run (Permission denied)
```bash
chmod +x verify-setup.sh
chmod +x deploy-functions.sh
```

### "Supabase CLI not found"
```bash
npm install -g supabase
```

### "Not logged in to Supabase"
```bash
supabase login
```

### "Project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Get PROJECT_REF from: Supabase Dashboard → Settings → General

### Function deployment fails
1. Check function directory exists in `supabase/functions/`
2. Verify function has valid `index.ts`
3. Check for syntax errors in function code
4. Review error message in terminal

### Can't find environment variables
They're in: Supabase Dashboard → Settings → Edge Functions → Secrets

---

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `verify-setup.sh` | Pre-flight environment check |
| `deploy-functions.sh` | Automated function deployment |
| `.env.production.template` | Environment variables template |
| `QUICK_SETUP.md` | Step-by-step setup guide |
| `FINAL_PRODUCTION_CHECKLIST.md` | Complete pre-launch checklist |

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Run verify-setup.sh | 30 seconds |
| Fix any issues found | 5-10 minutes |
| Set environment variables | 5 minutes |
| Run deploy-functions.sh | 5 minutes |
| Verify deployment | 2 minutes |
| **Total** | **~20 minutes** |

---

## 💡 Tips

1. **Run verify-setup.sh first** - catches issues early
2. **Set all env vars before deploying** - functions need them
3. **Deploy functions before frontend** - frontend calls these APIs
4. **Test super-admin-login first** - quickest way to verify setup
5. **Check logs if errors** - Supabase → Edge Functions → Logs

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the output** - Scripts provide detailed error messages
2. **Review logs** - Supabase Dashboard → Edge Functions → [Function] → Logs
3. **Verify environment** - All required secrets set in Supabase
4. **Check browser console** - F12 → Console for frontend errors
5. **Read full guide** - See `QUICK_SETUP.md` for detailed walkthrough

---

## ✅ Success Indicators

You're ready for production when:

- ✅ `verify-setup.sh` shows all green checkmarks
- ✅ `deploy-functions.sh` reports 25/25 successful
- ✅ Supabase shows all functions as "Deployed"
- ✅ Super admin login works at `/super-admin/login`
- ✅ Agency signup creates account successfully
- ✅ Content generation produces output
- ✅ No errors in browser console

---

**These scripts save you ~30 minutes of manual work and reduce deployment errors.** Use them! 🚀
