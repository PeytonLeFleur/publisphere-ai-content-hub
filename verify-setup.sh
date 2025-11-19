#!/bin/bash

# PubliSphere Setup Verification Script
# Checks if everything is configured correctly before launch

set -e

echo "🔍 PubliSphere Setup Verification"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Check Supabase CLI
echo "📦 Checking dependencies..."
if command -v supabase &> /dev/null; then
    check "Supabase CLI installed"
else
    echo -e "${RED}❌ Supabase CLI not installed${NC}"
    echo "   Install with: npm install -g supabase"
    ERRORS=$((ERRORS + 1))
fi

# 2. Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check "Node.js installed ($NODE_VERSION)"
else
    echo -e "${RED}❌ Node.js not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🗄️  Checking database..."

# 3. Check if linked to project
if supabase status &> /dev/null 2>&1; then
    check "Linked to Supabase project"
else
    echo -e "${RED}❌ Not linked to Supabase project${NC}"
    echo "   Run: supabase link --project-ref YOUR_PROJECT_REF"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📁 Checking project files..."

# 4. Check migration files exist
MIGRATIONS=(
    "supabase/migrations/20251118000000_add_voice_agents.sql"
    "supabase/migrations/20251118000001_create_knowledge_base_storage.sql"
    "supabase/migrations/20251118000002_add_service_packages.sql"
    "supabase/migrations/20251118000003_add_super_admin.sql"
    "supabase/migrations/20251118000004_add_super_admin_analytics.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        check "Migration file: $(basename $migration)"
    else
        echo -e "${RED}❌ Missing migration: $(basename $migration)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "⚙️  Checking edge functions..."

# 5. Check edge function directories exist
REQUIRED_FUNCTIONS=(
    "agency-signup"
    "generate-content"
    "stripe-webhooks"
    "super-admin-login"
)

for func in "${REQUIRED_FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        check "Function directory: $func"
    else
        warn "Missing function directory: $func"
    fi
done

echo ""
echo "📝 Checking configuration files..."

# 6. Check important files
if [ -f "package.json" ]; then
    check "package.json exists"
else
    echo -e "${RED}❌ package.json missing${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "vite.config.ts" ]; then
    check "vite.config.ts exists"
else
    warn "vite.config.ts missing"
fi

if [ -f ".gitignore" ]; then
    check ".gitignore exists"
else
    warn ".gitignore missing"
fi

echo ""
echo "🔐 Checking environment template..."

if [ -f ".env.production.template" ]; then
    check "Environment template exists"

    # Check if encryption key is in template
    if grep -q "ENCRYPTION_SECRET=" ".env.production.template"; then
        check "Encryption key in template"
    else
        warn "Encryption key not in template"
    fi
else
    warn "Environment template missing"
fi

echo ""
echo "=================================="
echo "📊 Verification Summary"
echo "=================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Perfect! All checks passed.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: supabase db push"
    echo "2. Deploy edge functions: ./deploy-functions.sh"
    echo "3. Set environment variables in Supabase Dashboard"
    echo "4. Deploy frontend to Vercel"
    echo "5. Configure Stripe webhooks"
    echo ""
    echo "Follow QUICK_SETUP.md for detailed instructions."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warnings found (non-critical)${NC}"
    echo ""
    echo "You can proceed with setup, but review warnings above."
    exit 0
else
    echo -e "${RED}❌ $ERRORS errors found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warnings found${NC}"
    fi
    echo ""
    echo "Fix the errors above before proceeding with setup."
    exit 1
fi
