import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Settings,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  fadeInUp,
  staggerContainer,
  staggerItem
} from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AgencyBilling = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState("");
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    activeSubscriptions: 0,
    totalClients: 0,
  });

  const [plans, setPlans] = useState<any[]>([]);

  // Create plan form state
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    priceMonthly: "",
    maxPostsPerMonth: "",
    isDefault: false,
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Check Stripe connection status
      const { data: agency } = await supabase
        .from('agencies')
        .select('id, stripe_account_id, stripe_onboarding_completed')
        .eq('contact_email', user.email)
        .single();

      if (!agency) {
        toast({
          title: "Error",
          description: "Agency not found",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (agency?.stripe_onboarding_completed) {
        setStripeConnected(true);

        // Load subscription plans with counts
        const { data: plansData } = await supabase
          .from('subscription_plans')
          .select(`
            *,
            client_subscriptions (
              id,
              status
            )
          `)
          .eq('agency_id', agency.id)
          .eq('is_active', true);

        if (plansData) {
          const plansWithCounts = plansData.map((plan: any) => ({
            ...plan,
            activeSubscriptions: plan.client_subscriptions?.filter(
              (sub: any) => sub.status === 'active' || sub.status === 'trialing'
            ).length || 0,
            priceMonthly: parseFloat(plan.price_monthly),
          }));
          setPlans(plansWithCounts);
        }

        // Load revenue stats
        const { data: statsData } = await supabase.rpc('get_agency_revenue_stats', {
          agency_uuid: agency.id
        });

        if (statsData) {
          setStats({
            totalRevenue: statsData.total_revenue || 0,
            monthlyRecurringRevenue: statsData.monthly_recurring_revenue || 0,
            activeSubscriptions: statsData.active_subscriptions || 0,
            totalClients: statsData.total_clients || 0,
          });
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading billing data:', error);
      setIsLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding');

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Stripe",
        variant: "destructive",
      });
    }
  };

  const handleCreatePlan = async () => {
    try {
      // Validation
      if (!newPlan.name || !newPlan.priceMonthly || !newPlan.maxPostsPerMonth) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const priceMonthly = parseFloat(newPlan.priceMonthly);
      const maxPostsPerMonth = parseInt(newPlan.maxPostsPerMonth);

      if (isNaN(priceMonthly) || priceMonthly <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }

      if (isNaN(maxPostsPerMonth) || maxPostsPerMonth <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid number of posts",
          variant: "destructive",
        });
        return;
      }

      setIsCreatingPlan(true);

      const { data, error } = await supabase.functions.invoke('create-subscription-plan', {
        body: {
          name: newPlan.name,
          description: newPlan.description,
          priceMonthly,
          currency: 'usd',
          billingInterval: 'month',
          maxPostsPerMonth,
          isDefault: newPlan.isDefault,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });

      // Reset form
      setNewPlan({
        name: "",
        description: "",
        priceMonthly: "",
        maxPostsPerMonth: "",
        isDefault: false,
      });
      setShowCreatePlan(false);

      // Reload billing data
      await loadBillingData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPlan(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="skeleton h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stripeConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <Card className="p-12 text-center">
              <div className="p-6 bg-muted/50 rounded-full w-fit mx-auto mb-6">
                <CreditCard className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Connect Your Stripe Account</h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                To start billing your clients, you need to connect your Stripe account.
                This allows you to collect payments directly into your own Stripe account.
              </p>

              <div className="bg-muted/30 border border-border rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
                <h3 className="font-semibold mb-4">What you'll need:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                    <span>Business information (name, address, tax ID)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                    <span>Bank account details for payouts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                    <span>Identity verification documents</span>
                  </li>
                </ul>
              </div>

              <Button
                size="lg"
                className="btn-premium gap-2"
                onClick={handleConnectStripe}
              >
                <CreditCard className="h-5 w-5" />
                Connect Stripe Account
              </Button>

              <p className="text-sm text-muted-foreground mt-4">
                Powered by Stripe Connect • Secure & PCI compliant
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Billing & Revenue</h1>
              <p className="text-muted-foreground text-lg">
                Manage your subscription plans and track revenue
              </p>
            </div>
            <Button
              className="btn-premium gap-2"
              onClick={() => setShowCreatePlan(true)}
            >
              <Plus className="h-5 w-5" />
              Create Plan
            </Button>
          </div>

          {/* Status Banners */}
          <div className="space-y-4">
            <div className="bg-foreground/5 border border-foreground/10 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Stripe Connected</div>
                  <div className="text-sm text-muted-foreground">
                    Payments are being processed through your Stripe account
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Manage
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-100">Configure API Key</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Set up your Claude API key to enable content generation for clients
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                onClick={() => navigate('/agency/api-settings')}
              >
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Revenue Stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              icon: DollarSign,
              label: "Total Revenue",
              value: `$${stats.totalRevenue.toLocaleString()}`,
              change: "+12%",
            },
            {
              icon: RefreshCw,
              label: "Monthly Recurring",
              value: `$${stats.monthlyRecurringRevenue.toLocaleString()}`,
              change: "+8%",
            },
            {
              icon: Users,
              label: "Active Subscriptions",
              value: stats.activeSubscriptions.toString(),
              change: "+3",
            },
            {
              icon: TrendingUp,
              label: "Total Clients",
              value: stats.totalClients.toString(),
              change: "+5",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={staggerItem}>
                <Card className="metric-card group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg group-hover:bg-foreground/10 transition-colors">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="text-sm text-foreground font-medium">
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Subscription Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold mb-6">Subscription Plans</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="card-premium p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    plan.isActive
                      ? 'bg-foreground/10 text-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Up to {plan.maxPostsPerMonth} posts/month
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active subscriptions</span>
                    <span className="font-semibold">{plan.activeSubscriptions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Monthly revenue</span>
                    <span className="font-semibold">
                      ${(plan.priceMonthly * plan.activeSubscriptions).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Clients
                  </Button>
                </div>
              </Card>
            ))}

            {/* Add New Plan Card */}
            <Card
              className="card-premium p-6 cursor-pointer border-dashed"
              onClick={() => setShowCreatePlan(true)}
            >
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Create New Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Add another subscription tier
                </p>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Create Plan Modal */}
        {showCreatePlan && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6">Create Subscription Plan</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="planName">Plan Name *</Label>
                  <Input
                    id="planName"
                    placeholder="e.g., Professional Plan"
                    className="mt-2"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                    disabled={isCreatingPlan}
                  />
                </div>

                <div>
                  <Label htmlFor="planDescription">Description</Label>
                  <Textarea
                    id="planDescription"
                    placeholder="Brief description of what this plan includes"
                    className="mt-2"
                    rows={3}
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    disabled={isCreatingPlan}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Monthly Price *</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        placeholder="99"
                        className="pl-7"
                        value={newPlan.priceMonthly}
                        onChange={(e) => setNewPlan({ ...newPlan, priceMonthly: e.target.value })}
                        disabled={isCreatingPlan}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="posts">Posts Per Month *</Label>
                    <Input
                      id="posts"
                      type="number"
                      placeholder="50"
                      className="mt-2"
                      value={newPlan.maxPostsPerMonth}
                      onChange={(e) => setNewPlan({ ...newPlan, maxPostsPerMonth: e.target.value })}
                      disabled={isCreatingPlan}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    className="h-4 w-4 rounded border-border"
                    checked={newPlan.isDefault}
                    onChange={(e) => setNewPlan({ ...newPlan, isDefault: e.target.checked })}
                    disabled={isCreatingPlan}
                  />
                  <Label htmlFor="isDefault" className="font-normal">
                    Make this the default plan for new clients
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePlan(false)}
                    className="flex-1"
                    disabled={isCreatingPlan}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="btn-premium flex-1"
                    onClick={handleCreatePlan}
                    disabled={isCreatingPlan}
                  >
                    {isCreatingPlan ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyBilling;
