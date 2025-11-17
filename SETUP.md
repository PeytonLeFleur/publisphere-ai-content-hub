# Publisphere Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Deno (for Supabase Edge Functions)
- Supabase CLI: `npm install -g supabase`
- Git

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd publisphere-ai-content-hub
npm install
```

### 2. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Wait for database to provision (~2 minutes)
4. Go to Project Settings → API
5. Copy your project URL and anon key

### 3. Set Up Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your Supabase credentials
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### 4. Generate Encryption Key

```bash
# Generate a secure encryption key
deno run supabase/functions/_shared/generate-key.ts

# Copy the output (64 hex characters)
```

### 5. Link Supabase Project

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id
```

### 6. Run Database Migrations

```bash
# Push all migrations to your Supabase database
supabase db push
```

### 7. Set Edge Function Secrets

```bash
# Set encryption secret (use the key you generated in step 4)
supabase secrets set ENCRYPTION_SECRET=<your_64_char_hex_key>

# Set Supabase credentials for edge functions
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

To get your service role key:
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the `service_role` key (under "Project API keys")

### 8. Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy generate-content
supabase functions deploy wordpress-connect
supabase functions deploy wordpress-publish
supabase functions deploy send-notification
supabase functions deploy process-jobs
```

### 9. Start Development Server

```bash
npm run dev
```

Visit http://localhost:5173

---

## Testing the Setup

### Test Database Connection

1. Go to http://localhost:5173
2. Open browser console
3. You should see no errors related to Supabase

### Test Encryption

```bash
# Run test script
deno run --allow-env supabase/functions/_shared/test-encryption.ts
```

### Test Edge Function Locally

```bash
# Start Supabase local development
supabase functions serve

# In another terminal, test the function
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-content' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action": "test"}'
```

---

## Production Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Deploy

### Edge Functions (Already on Supabase)

Edge functions are already deployed when you run `supabase functions deploy`.

No additional hosting needed.

---

## Troubleshooting

### "ENCRYPTION_SECRET environment variable not set"

You forgot to set edge function secrets. Run:
```bash
supabase secrets set ENCRYPTION_SECRET=<your_key>
```

### "Failed to decrypt data"

The ENCRYPTION_SECRET used to encrypt is different from the one used to decrypt.

**Fix**: You need to re-encrypt all existing data with the new key, or clear your database and start fresh.

### "Unauthorized" errors in edge functions

Check that:
1. User is logged in (Supabase Auth)
2. JWT token is being sent in Authorization header
3. User email exists in `clients` table

### "WordPress connection failed"

1. Verify WordPress site URL is correct (with https://)
2. Ensure WordPress REST API is enabled
3. Check that Application Password is correct (not regular password)
4. Verify username is correct (not email, the actual WordPress username)

### Database migrations fail

If you see errors running migrations, your Supabase project might have an incompatible schema.

**Nuclear option**:
```bash
supabase db reset
```
This will wipe your database and re-run all migrations fresh.

---

## Next Steps

1. **Create Test Agency**: Use the signup form at `/signup/agency`
2. **Add API Keys**: Go to Settings → API Keys and add an Anthropic API key
3. **Connect WordPress**: Go to Settings → WordPress and connect a test site
4. **Generate Content**: Try generating a blog article
5. **Publish to WordPress**: Test the publishing flow

---

## Security Checklist

Before going to production:

- [ ] All edge function secrets are set
- [ ] ENCRYPTION_SECRET is a strong random 64-char hex string
- [ ] Service role key is kept secret (not in .env, only in Supabase secrets)
- [ ] RLS policies are enabled on all tables
- [ ] CORS headers are properly configured
- [ ] Rate limiting is enabled (Supabase handles this)
- [ ] All API keys are encrypted before storage
- [ ] No secrets are committed to Git

---

## Getting Help

- Check the `AUDIT_REPORT.md` for known issues
- Review Supabase docs: https://supabase.com/docs
- Check Deno docs for edge functions: https://deno.land/manual
- Open an issue on GitHub
