#!/bin/bash

# PubliSphere Edge Functions Deployment Script
# This script deploys all 25 edge functions to Supabase

set -e  # Exit on error

echo "🚀 PubliSphere Edge Functions Deployment"
echo "========================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📦 Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "🔑 Run: supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# List of all edge functions to deploy
FUNCTIONS=(
    "agency-signup"
    "client-management"
    "generate-content"
    "process-jobs"
    "process-scheduled-jobs"
    "send-notification"
    "wordpress-connect"
    "wordpress-publish"
    "create-subscription-plan"
    "create-client-subscription"
    "stripe-connect-onboarding"
    "stripe-webhooks"
    "save-twilio-credentials"
    "save-elevenlabs-key"
    "provision-phone-number"
    "create-voice-agent"
    "delete-voice-agent"
    "upload-knowledge-file"
    "process-knowledge-embeddings"
    "twilio-webhook"
    "twilio-status-callback"
    "get-call-logs"
    "create-service-package"
    "subscribe-client-to-package"
    "super-admin-login"
)

TOTAL=${#FUNCTIONS[@]}
CURRENT=0
FAILED=()

echo "📋 Deploying $TOTAL edge functions..."
echo ""

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    CURRENT=$((CURRENT + 1))
    echo "[$CURRENT/$TOTAL] Deploying $func..."

    if supabase functions deploy "$func" --no-verify-jwt; then
        echo "   ✅ $func deployed successfully"
    else
        echo "   ❌ $func failed to deploy"
        FAILED+=("$func")
    fi
    echo ""
done

echo "========================================"
echo "📊 Deployment Summary"
echo "========================================"
echo "Total functions: $TOTAL"
echo "Successful: $((TOTAL - ${#FAILED[@]}))"
echo "Failed: ${#FAILED[@]}"
echo ""

if [ ${#FAILED[@]} -eq 0 ]; then
    echo "🎉 All functions deployed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify functions in Supabase Dashboard → Edge Functions"
    echo "2. Check environment variables are set"
    echo "3. Test critical functions with test requests"
    exit 0
else
    echo "⚠️  Some functions failed to deploy:"
    for func in "${FAILED[@]}"; do
        echo "   - $func"
    done
    echo ""
    echo "💡 Troubleshooting:"
    echo "1. Check if function directories exist in supabase/functions/"
    echo "2. Verify you're linked to correct project"
    echo "3. Check function code for syntax errors"
    echo "4. Review deployment logs above"
    exit 1
fi
