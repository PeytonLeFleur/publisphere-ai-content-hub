import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  });

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`Processing webhook: ${event.type}`);

    // Log webhook event
    await supabaseClient
      .from('billing_events')
      .insert({
        event_type: event.type,
        stripe_event_id: event.id,
        event_data: event.data.object as any,
        agency_id: (event.data.object as any).metadata?.agency_id,
        client_id: (event.data.object as any).metadata?.client_id,
      });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabaseClient);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseClient);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseClient);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabaseClient);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account, supabaseClient);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const subscriptionId = session.subscription as string;
  const clientId = session.metadata?.client_id;

  if (!subscriptionId || !clientId) {
    console.error('Missing subscription ID or client ID in session metadata');
    return;
  }

  // Update subscription record with Stripe subscription ID
  await supabase
    .from('client_subscriptions')
    .update({
      stripe_subscription_id: subscriptionId,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', clientId)
    .eq('status', 'pending');

  console.log(`Checkout completed for client: ${clientId}`);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const clientId = subscription.metadata?.client_id;

  if (!clientId) {
    console.error('No client ID in subscription metadata');
    return;
  }

  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  await supabase
    .from('client_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      trial_end: trialEnd?.toISOString(),
      next_billing_date: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription updated: ${subscription.id} -> ${subscription.status}`);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  await supabase
    .from('client_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription canceled: ${subscription.id}`);
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const subscriptionId = invoice.subscription as string;
  const clientId = invoice.subscription_details?.metadata?.client_id;
  const agencyId = invoice.subscription_details?.metadata?.agency_id;

  if (!subscriptionId) return;

  // Get subscription record
  const { data: subscription } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found for invoice');
    return;
  }

  // Record payment
  await supabase
    .from('subscription_payments')
    .insert({
      subscription_id: subscription.id,
      client_id: subscription.client_id,
      agency_id: subscription.agency_id,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_charge_id: invoice.charge as string,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: 'succeeded',
      description: invoice.description,
      invoice_url: invoice.hosted_invoice_url,
      receipt_url: invoice.invoice_pdf,
      payment_date: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    });

  // Update subscription with last payment info
  await supabase
    .from('client_subscriptions')
    .update({
      last_payment_date: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
      last_payment_amount: invoice.amount_paid / 100,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  console.log(`Payment succeeded for subscription: ${subscriptionId}`);
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Get subscription record
  const { data: subscription } = await supabase
    .from('client_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) return;

  // Record failed payment
  await supabase
    .from('subscription_payments')
    .insert({
      subscription_id: subscription.id,
      client_id: subscription.client_id,
      agency_id: subscription.agency_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      description: invoice.description,
      failed_at: new Date().toISOString(),
    });

  // Update subscription status
  await supabase
    .from('client_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  console.log(`Payment failed for subscription: ${subscriptionId}`);
}

async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: any
) {
  // Update agency Stripe account status
  await supabase
    .from('agencies')
    .update({
      stripe_account_status: account.details_submitted ? 'connected' : 'pending',
      stripe_onboarding_completed: account.details_submitted,
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_account_id', account.id);

  console.log(`Account updated: ${account.id}`);
}
