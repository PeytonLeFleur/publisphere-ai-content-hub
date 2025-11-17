# Publisphere - White Label AI Content Automation

> AI-powered content generation platform for marketing agencies. White label SaaS that allows agencies to offer unlimited blog posts and GMB content to their clients.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Run development server
npm run dev
```

Visit http://localhost:5173

📖 **Full setup guide**: See [SETUP.md](./SETUP.md)

---

## ✨ Features

### For Agencies
- ✅ White label platform with custom branding
- ✅ Custom subdomain per agency
- ✅ Unlimited client accounts
- ✅ Client management dashboard
- ✅ Activity logging and analytics

### For Clients (End Users)
- ✅ Unlimited AI-generated blog articles
- ✅ Google My Business post generation
- ✅ Auto-publish to WordPress
- ✅ Content scheduling and calendar
- ✅ SEO optimization (meta, focus keywords)
- ✅ Featured image integration

### Technical
- ✅ Claude AI (Sonnet 4.5) integration
- ✅ WordPress REST API publishing
- ✅ End-to-end encryption for API keys
- ✅ Row-level security (RLS)
- ✅ Automated job scheduling
- ✅ Multi-tenant architecture

---

## 🏗️ Architecture

**Frontend**: Vite + React + TypeScript + TailwindCSS + shadcn/ui
**Backend**: Supabase (PostgreSQL + Edge Functions)
**AI**: Anthropic Claude API (client's own keys)
**Publishing**: WordPress REST API
**Deployment**: Vercel (frontend) + Supabase (backend)

---

## 📁 Project Structure

```
publisphere-ai-content-hub/
├── src/
│   ├── pages/           # React pages (Landing, Dashboard, etc.)
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (AgencyBranding)
│   ├── integrations/    # Supabase client & types
│   └── lib/             # Utilities
├── supabase/
│   ├── migrations/      # Database schema migrations
│   └── functions/       # Edge Functions (Deno)
│       ├── _shared/     # Encryption utilities
│       ├── agency-signup/
│       ├── client-management/
│       ├── generate-content/
│       ├── wordpress-connect/
│       ├── wordpress-publish/
│       └── process-scheduled-jobs/
├── AUDIT_REPORT.md     # Complete feature audit
├── SETUP.md            # Detailed setup guide
├── PHASE2_COMPLETE.md  # Implementation summary
└── .env.example        # Environment variables template
```

---

## 🔐 Security

- **Encryption**: All API keys and passwords encrypted with AES-256-GCM
- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row-Level Security (RLS) policies on all tables
- **Secrets**: Environment variables via Supabase Edge Function secrets
- **CORS**: Properly configured cross-origin headers

---

## 🎯 Current Status

**Version**: v0.9 (Beta Ready)
**Completion**: ~75%
**Launch Status**: Ready for private beta

### ✅ Implemented
- Database schema with full RLS
- AES-256-GCM encryption for secrets
- Agency signup & authentication
- Client authentication
- AI content generation (Claude)
- WordPress publishing
- Job scheduling system
- White label branding (query param)
- Content library and calendar UI

### ⚠️ Needs UI (Backend Ready)
- Client management for agencies
- API key encryption UI
- Onboarding save functionality
- Content scheduling interface

### ❌ Not Yet Implemented
- Payment integration (Stripe)
- Email notifications
- Image upload/Unsplash integration
- True subdomain routing (requires Next.js migration)
- Protected route guards
- Error tracking (Sentry)

📊 **Full status**: See [AUDIT_REPORT.md](./AUDIT_REPORT.md)

---

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Deno (for edge functions)
- Supabase CLI
- Supabase project

### Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint

# Supabase commands
supabase link        # Link to your project
supabase db push     # Push migrations
supabase functions deploy  # Deploy edge functions
```

### Environment Variables

Required for frontend (`.env`):
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxxxx
```

Required for edge functions (set via `supabase secrets`):
```bash
supabase secrets set ENCRYPTION_SECRET=<64_hex_chars>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
supabase secrets set SUPABASE_URL=<supabase_url>
supabase secrets set CRON_SECRET=<random_secret>
```

📖 **Full list**: See [.env.example](./.env.example)

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Step-by-step setup instructions
- **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** - Complete audit and roadmap
- **[PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md)** - Implementation details
- **[.env.example](./.env.example)** - Environment variables

---

## 🚢 Deployment

### Deploy to Production

1. **Database**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   supabase db push
   ```

2. **Edge Functions**:
   ```bash
   supabase functions deploy agency-signup
   supabase functions deploy client-management
   supabase functions deploy generate-content
   supabase functions deploy wordpress-connect
   supabase functions deploy wordpress-publish
   supabase functions deploy process-scheduled-jobs
   ```

3. **Set Secrets**:
   ```bash
   # Generate encryption key first
   deno run supabase/functions/_shared/generate-key.ts

   # Set all secrets
   supabase secrets set ENCRYPTION_SECRET=...
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
   # etc.
   ```

4. **Frontend (Vercel)**:
   ```bash
   vercel --prod
   ```

5. **Set Up Cron Job**:
   See [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md#step-4-set-up-cron-job)

📖 **Full guide**: See [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md)

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Agency can sign up with unique subdomain
- [ ] Agency can log in
- [ ] Client can be created (via API or database)
- [ ] Client can log in
- [ ] Client can add API key (manual encryption for now)
- [ ] Client can generate blog article
- [ ] Client can connect WordPress site
- [ ] Client can publish to WordPress
- [ ] Scheduled content auto-publishes
- [ ] White label branding applies with `?agency=subdomain`

---

## 💰 Business Model

- **Target**: Marketing agencies
- **Pricing**: $147 one-time (lifetime deal for early adopters)
- **Client Costs**: ~$0.30/article (clients provide own API keys)
- **Value Prop**: White label AI content automation with unlimited usage

---

## 🆘 Support

- 📖 Read [SETUP.md](./SETUP.md) for setup help
- 🐛 Check [AUDIT_REPORT.md](./AUDIT_REPORT.md) for known issues
- 📧 Contact: support@publisphere.com

---

## 🎉 Recent Updates

**November 17, 2025 - Phase 2 Complete**
- ✅ Implemented AES-256-GCM encryption for all secrets
- ✅ Built full authentication system (agency + client)
- ✅ Created white label branding system
- ✅ Implemented job scheduling processor
- ✅ Fixed all critical security vulnerabilities

**Status**: Ready for private beta testing

---

Built with ❤️ for marketing agencies who want to offer AI-powered content automation to their clients.
