#!/bin/bash

# Interactive Deployment Checklist for PubliSphere
# Guides you through all deployment steps with progress tracking

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Progress tracking
TOTAL_STEPS=14
CURRENT_STEP=0
COMPLETED_STEPS=()
SKIPPED_STEPS=()

# Clear screen
clear

# Banner
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}          ${BOLD}PubliSphere Deployment Checklist${NC}                     ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}          30-Minute Setup to Production                      ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to show progress
show_progress() {
    local completed=${#COMPLETED_STEPS[@]}
    local percent=$((completed * 100 / TOTAL_STEPS))
    local bar_length=50
    local filled=$((completed * bar_length / TOTAL_STEPS))

    echo -e "\n${BOLD}Progress: ${completed}/${TOTAL_STEPS} steps completed${NC}"
    echo -n "["
    for ((i=0; i<filled; i++)); do echo -n "█"; done
    for ((i=filled; i<bar_length; i++)); do echo -n "░"; done
    echo "] ${percent}%"
    echo ""
}

# Function to mark step complete
complete_step() {
    COMPLETED_STEPS+=($1)
    echo -e "${GREEN}✅ Step $1 completed!${NC}\n"
    sleep 1
}

# Function to ask yes/no
ask_yes_no() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

# Function to wait for user
wait_for_user() {
    echo -e "\n${YELLOW}Press Enter when done...${NC}"
    read
}

# ============================================================================
# STEP 1: Welcome & Prerequisites
# ============================================================================
step_1() {
    CURRENT_STEP=1
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 1/${TOTAL_STEPS}: Welcome & Prerequisites Check                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${BOLD}Welcome to PubliSphere deployment!${NC}"
    echo ""
    echo "This wizard will guide you through deploying your app to production."
    echo ""
    echo -e "${YELLOW}What you'll need:${NC}"
    echo "  • Supabase account (free tier OK)"
    echo "  • OpenAI API key (~\$5/month)"
    echo "  • Stripe account (free, charges only on transactions)"
    echo "  • Vercel account (free tier OK)"
    echo "  • 30-60 minutes of focused time"
    echo ""
    echo -e "${YELLOW}Have these ready?${NC}"
    echo "  • Supabase project created"
    echo "  • GitHub account connected"
    echo "  • Email access for verification"
    echo ""

    if ask_yes_no "Ready to proceed?"; then
        complete_step 1
        return 0
    else
        echo ""
        echo "No problem! Set up your accounts first:"
        echo "  1. Supabase: https://supabase.com"
        echo "  2. OpenAI: https://platform.openai.com"
        echo "  3. Stripe: https://stripe.com"
        echo "  4. Vercel: https://vercel.com"
        echo ""
        exit 0
    fi
}

# ============================================================================
# STEP 2: Verify Local Setup
# ============================================================================
step_2() {
    CURRENT_STEP=2
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 2/${TOTAL_STEPS}: Verify Local Setup                             ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Running verification script..."
    echo ""

    if [ -f "./verify-setup.sh" ]; then
        ./verify-setup.sh

        if [ $? -eq 0 ]; then
            complete_step 2
        else
            echo ""
            echo -e "${RED}Verification failed. Please fix errors and run again.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}verify-setup.sh not found!${NC}"
        exit 1
    fi
}

# ============================================================================
# STEP 3: Login to Supabase
# ============================================================================
step_3() {
    CURRENT_STEP=3
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 3/${TOTAL_STEPS}: Login to Supabase                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Logging in to Supabase..."
    echo ""

    if supabase login; then
        echo ""
        complete_step 3
    else
        echo ""
        echo -e "${RED}Login failed. Please check your credentials.${NC}"
        exit 1
    fi
}

# ============================================================================
# STEP 4: Link to Supabase Project
# ============================================================================
step_4() {
    CURRENT_STEP=4
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 4/${TOTAL_STEPS}: Link to Supabase Project                       ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Get your project reference from:"
    echo -e "${BLUE}https://supabase.com/dashboard/project/_/settings/general${NC}"
    echo ""
    echo "It looks like: abcdefghijklmnopqrst"
    echo ""

    read -p "Enter your Supabase project reference: " project_ref

    if [ -z "$project_ref" ]; then
        echo -e "${RED}Project reference cannot be empty${NC}"
        exit 1
    fi

    echo ""
    echo "Linking to project..."

    if supabase link --project-ref "$project_ref"; then
        echo ""
        complete_step 4
    else
        echo ""
        echo -e "${RED}Failed to link to project. Check your project reference.${NC}"
        exit 1
    fi
}

# ============================================================================
# STEP 5: Push Database Migrations
# ============================================================================
step_5() {
    CURRENT_STEP=5
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 5/${TOTAL_STEPS}: Push Database Migrations                       ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "This will create 20+ tables in your Supabase database."
    echo ""

    if ask_yes_no "Push database migrations now?"; then
        echo ""
        echo "Pushing migrations..."

        if supabase db push; then
            echo ""
            echo -e "${GREEN}✅ Database migrations completed!${NC}"
            echo ""
            echo "Verify in Supabase Dashboard → Database → Tables"
            echo "You should see: agencies, clients, content_items, etc."
            echo ""
            wait_for_user
            complete_step 5
        else
            echo ""
            echo -e "${RED}Migration failed. Check the error above.${NC}"
            exit 1
        fi
    else
        echo "Skipping database push. You'll need to run 'supabase db push' manually."
        SKIPPED_STEPS+=(5)
    fi
}

# ============================================================================
# STEP 6: Save Encryption Key
# ============================================================================
step_6() {
    CURRENT_STEP=6
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 6/${TOTAL_STEPS}: Save Encryption Key                            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${BOLD}⚠️  CRITICAL - READ CAREFULLY ⚠️${NC}"
    echo ""
    echo "Your encryption key (already generated):"
    echo ""
    echo -e "${YELLOW}e5719971c76556911d333e23fd8c104c28ea62e315ed060fad1136afdc775d93${NC}"
    echo ""
    echo -e "${RED}You MUST save this key somewhere safe!${NC}"
    echo ""
    echo "Save it in:"
    echo "  1. Password manager (1Password, LastPass, BitWarden)"
    echo "  2. Encrypted notes (iCloud, Google Drive)"
    echo "  3. Physical paper in safe place"
    echo ""
    echo "Without this key, all encrypted API credentials are lost FOREVER."
    echo ""

    if ask_yes_no "Have you saved the encryption key?"; then
        complete_step 6
    else
        echo ""
        echo -e "${RED}Please save the key before continuing!${NC}"
        exit 1
    fi
}

# ============================================================================
# STEP 7: Set Environment Variables
# ============================================================================
step_7() {
    CURRENT_STEP=7
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 7/${TOTAL_STEPS}: Set Environment Variables                      ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Go to Supabase Dashboard:"
    echo -e "${BLUE}https://supabase.com/dashboard/project/_/settings/functions${NC}"
    echo ""
    echo "Click 'Add new secret' for each of these:"
    echo ""
    echo -e "${YELLOW}1. ENCRYPTION_SECRET${NC}"
    echo "   Value: e5719971c76556911d333e23fd8c104c28ea62e315ed060fad1136afdc775d93"
    echo ""
    echo -e "${YELLOW}2. OPENAI_API_KEY${NC}"
    echo "   Get from: https://platform.openai.com/api-keys"
    echo "   Starts with: sk-proj-"
    echo ""
    echo -e "${YELLOW}3. STRIPE_SECRET_KEY${NC}"
    echo "   Get from: https://dashboard.stripe.com/apikeys"
    echo "   Use: sk_test_ for testing, sk_live_ for production"
    echo ""
    echo -e "${YELLOW}4. STRIPE_WEBHOOK_SECRET${NC}"
    echo "   Leave blank for now (we'll add it in Step 11)"
    echo ""

    wait_for_user

    if ask_yes_no "Have you added all environment variables?"; then
        complete_step 7
    else
        echo "You can add them later, but edge functions won't work without them."
        SKIPPED_STEPS+=(7)
    fi
}

# ============================================================================
# STEP 8: Deploy Edge Functions
# ============================================================================
step_8() {
    CURRENT_STEP=8
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 8/${TOTAL_STEPS}: Deploy Edge Functions                          ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "This will deploy all 25 edge functions to Supabase."
    echo "It takes about 5 minutes."
    echo ""

    if ask_yes_no "Deploy functions now?"; then
        echo ""

        if [ -f "./deploy-functions.sh" ]; then
            ./deploy-functions.sh

            if [ $? -eq 0 ]; then
                echo ""
                echo "Verify in Supabase Dashboard → Edge Functions"
                echo "All should show 'Deployed' status."
                echo ""
                wait_for_user
                complete_step 8
            else
                echo ""
                echo -e "${RED}Some functions failed to deploy. Check errors above.${NC}"
                exit 1
            fi
        else
            echo -e "${RED}deploy-functions.sh not found!${NC}"
            exit 1
        fi
    else
        echo "Skipping function deployment. Run './deploy-functions.sh' manually."
        SKIPPED_STEPS+=(8)
    fi
}

# ============================================================================
# STEP 9: Deploy Frontend to Vercel
# ============================================================================
step_9() {
    CURRENT_STEP=9
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 9/${TOTAL_STEPS}: Deploy Frontend to Vercel                      ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Deploy your React app to Vercel:"
    echo ""
    echo "1. Go to: https://vercel.com/new"
    echo "2. Import repository: PeytonLeFleur/publisphere-ai-content-hub"
    echo "3. Framework: Vite (auto-detected)"
    echo "4. Add environment variables:"
    echo ""
    echo "   Get these from Supabase → Settings → API:"
    echo ""
    echo "   VITE_SUPABASE_URL = https://yourproject.supabase.co"
    echo "   VITE_SUPABASE_ANON_KEY = eyJhbGc..."
    echo ""
    echo "5. Click 'Deploy'"
    echo "6. Wait 2-3 minutes for build"
    echo "7. Copy your Vercel URL"
    echo ""

    wait_for_user

    read -p "Enter your Vercel URL (or skip): " vercel_url

    if [ -n "$vercel_url" ]; then
        echo ""
        echo "Your app URL: $vercel_url"
        echo "Save this for later!"
        echo ""
        complete_step 9
    else
        echo "Skipping Vercel deployment. Deploy manually when ready."
        SKIPPED_STEPS+=(9)
    fi
}

# ============================================================================
# STEP 10: Configure Stripe Account
# ============================================================================
step_10() {
    CURRENT_STEP=10
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 10/${TOTAL_STEPS}: Configure Stripe Account                      ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Stripe is already configured if you added STRIPE_SECRET_KEY."
    echo ""
    echo "Next, we'll set up webhooks (Step 11)."
    echo ""

    if ask_yes_no "Stripe account ready?"; then
        complete_step 10
    else
        echo "Set up Stripe at: https://stripe.com"
        SKIPPED_STEPS+=(10)
    fi
}

# ============================================================================
# STEP 11: Configure Stripe Webhooks
# ============================================================================
step_11() {
    CURRENT_STEP=11
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 11/${TOTAL_STEPS}: Configure Stripe Webhooks                     ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Get your webhook URL from Supabase:"
    echo "Dashboard → Edge Functions → stripe-webhooks"
    echo ""
    echo "Format: https://PROJECT.supabase.co/functions/v1/stripe-webhooks"
    echo ""
    echo "Then:"
    echo "1. Go to: https://dashboard.stripe.com/webhooks"
    echo "2. Click 'Add endpoint'"
    echo "3. Paste your webhook URL"
    echo "4. Select these 6 events:"
    echo "   - checkout.session.completed"
    echo "   - customer.subscription.created"
    echo "   - customer.subscription.updated"
    echo "   - customer.subscription.deleted"
    echo "   - invoice.payment_succeeded"
    echo "   - invoice.payment_failed"
    echo "5. Click 'Add endpoint'"
    echo "6. Copy the 'Signing secret' (starts with whsec_)"
    echo "7. Add to Supabase → Settings → Edge Functions"
    echo "   Name: STRIPE_WEBHOOK_SECRET"
    echo "   Value: whsec_..."
    echo ""

    wait_for_user

    if ask_yes_no "Webhook configured and secret added?"; then
        complete_step 11
    else
        echo "You can configure webhooks later."
        SKIPPED_STEPS+=(11)
    fi
}

# ============================================================================
# STEP 12: Test Super Admin Login
# ============================================================================
step_12() {
    CURRENT_STEP=12
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 12/${TOTAL_STEPS}: Test Super Admin Login                        ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Test your super admin access:"
    echo ""
    echo "1. Go to: YOUR_URL/super-admin/login"
    echo "2. Email: plefleur00@gmail.com"
    echo "3. Password: Titan2022!"
    echo "4. You should see analytics dashboard"
    echo ""

    wait_for_user

    if ask_yes_no "Super admin login working?"; then
        complete_step 12
    else
        echo "Check that database migrations ran successfully."
        SKIPPED_STEPS+=(12)
    fi
}

# ============================================================================
# STEP 13: Test Agency Signup
# ============================================================================
step_13() {
    CURRENT_STEP=13
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 13/${TOTAL_STEPS}: Test Agency Signup                            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Test the agency signup flow:"
    echo ""
    echo "1. Go to: YOUR_URL/signup/agency"
    echo "2. Fill out form"
    echo "3. Check email for verification"
    echo "4. Complete onboarding"
    echo "5. You should reach agency dashboard"
    echo ""

    wait_for_user

    if ask_yes_no "Agency signup working?"; then
        complete_step 13
    else
        echo "Check edge function logs for errors."
        SKIPPED_STEPS+=(13)
    fi
}

# ============================================================================
# STEP 14: Final Verification
# ============================================================================
step_14() {
    CURRENT_STEP=14
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC} Step 14/${TOTAL_STEPS}: Final Verification                            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo "Final checks:"
    echo ""
    echo "✓ Database tables created"
    echo "✓ Edge functions deployed"
    echo "✓ Frontend deployed to Vercel"
    echo "✓ Environment variables set"
    echo "✓ Stripe configured"
    echo "✓ Super admin working"
    echo "✓ Agency signup working"
    echo ""

    if ask_yes_no "Everything working correctly?"; then
        complete_step 14
        return 0
    else
        echo "Review failed steps and troubleshoot."
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Run all steps
step_1
show_progress

step_2
show_progress

step_3
show_progress

step_4
show_progress

step_5
show_progress

step_6
show_progress

step_7
show_progress

step_8
show_progress

step_9
show_progress

step_10
show_progress

step_11
show_progress

step_12
show_progress

step_13
show_progress

step_14
show_progress

# Final summary
clear
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                  🎉 DEPLOYMENT COMPLETE! 🎉                    ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ PubliSphere is now live in production!${NC}"
echo ""
echo -e "${BOLD}Summary:${NC}"
echo "  Completed: ${#COMPLETED_STEPS[@]}/${TOTAL_STEPS} steps"

if [ ${#SKIPPED_STEPS[@]} -gt 0 ]; then
    echo -e "  ${YELLOW}Skipped: ${#SKIPPED_STEPS[@]} steps${NC}"
    echo ""
    echo "Skipped steps:"
    for step in "${SKIPPED_STEPS[@]}"; do
        echo "  - Step $step"
    done
fi

echo ""
echo -e "${BOLD}Next steps:${NC}"
echo "  1. Invite beta testers"
echo "  2. Monitor logs for errors"
echo "  3. Gather feedback"
echo "  4. Prepare for public launch"
echo ""
echo -e "${BOLD}Important URLs:${NC}"
echo "  • Your App: [your Vercel URL]"
echo "  • Super Admin: [your URL]/super-admin/login"
echo "  • Supabase: https://supabase.com/dashboard"
echo "  • Stripe: https://dashboard.stripe.com"
echo ""
echo -e "${GREEN}Congratulations! 🚀${NC}"
echo ""
