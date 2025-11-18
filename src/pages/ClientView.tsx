import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react";
import { fadeInUp } from "@/lib/animations";

const ClientView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', user.email)
        .single();

      if (!agency) {
        throw new Error('Agency not found');
      }

      // Load client with subscription details
      const { data: clientData, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_subscriptions (
            id,
            status,
            price_monthly,
            currency,
            posts_used_this_month,
            posts_limit,
            current_period_start,
            current_period_end,
            next_billing_date,
            subscription_plans (
              name,
              price_monthly,
              max_posts_per_month
            )
          )
        `)
        .eq('id', id)
        .eq('agency_id', agency.id)
        .single();

      if (error) throw error;

      setClient(clientData);
      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load client",
        variant: "destructive",
      });
      navigate('/clients');
    }
  };

  const getSubscriptionStatus = () => {
    const subscription = client?.client_subscriptions?.[0];
    if (!subscription) return null;

    const statusColors: Record<string, string> = {
      active: "text-green-600 bg-green-50 border-green-200",
      trialing: "text-blue-600 bg-blue-50 border-blue-200",
      past_due: "text-orange-600 bg-orange-50 border-orange-200",
      canceled: "text-gray-600 bg-gray-50 border-gray-200",
      unpaid: "text-red-600 bg-red-50 border-red-200",
    };

    const color = statusColors[subscription.status] || statusColors.canceled;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${color}`}>
        <DollarSign className="h-4 w-4" />
        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="skeleton h-12 w-64" />
          <div className="skeleton h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const subscription = client.client_subscriptions?.[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{client.business_name || "Unnamed Client"}</h1>
              <p className="text-muted-foreground text-lg">
                Client Details & Subscription
              </p>
            </div>
            <div className="flex gap-2">
              {!subscription && (
                <Button
                  className="btn-premium gap-2"
                  onClick={() => navigate('/clients')}
                >
                  <CreditCard className="h-4 w-4" />
                  Subscribe
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(`/clients/${id}/edit`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Information */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </h2>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{client.contact_email || "Not provided"}</div>
                    </div>
                  </div>

                  {client.contact_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <div className="font-medium">{client.contact_phone}</div>
                      </div>
                    </div>
                  )}

                  {client.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Website</div>
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {client.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {client.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Address</div>
                        <div className="font-medium">{client.address}</div>
                      </div>
                    </div>
                  )}

                  {client.industry && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm text-muted-foreground">Industry</div>
                        <div className="font-medium">{client.industry}</div>
                      </div>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Notes</div>
                    <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
                  </div>
                )}
              </Card>

              {/* Subscription Details */}
              {subscription && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Details
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      {getSubscriptionStatus()}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{subscription.subscription_plans?.name || "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">
                        ${subscription.price_monthly}/{subscription.currency === 'usd' ? 'month' : subscription.currency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Usage this month</span>
                      <span className="font-medium">
                        {subscription.posts_used_this_month} / {subscription.posts_limit} posts
                      </span>
                    </div>

                    {subscription.next_billing_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Next billing date</span>
                        <span className="font-medium">
                          {new Date(subscription.next_billing_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((subscription.posts_used_this_month / subscription.posts_limit) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {subscription.posts_limit - subscription.posts_used_this_month} posts remaining
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div className="font-medium">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Client ID</div>
                    <div className="font-mono text-xs">{client.id.slice(0, 8)}...</div>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/content')}
                  >
                    <FileText className="h-4 w-4" />
                    View Content
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/calendar')}
                  >
                    <Calendar className="h-4 w-4" />
                    View Calendar
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientView;
