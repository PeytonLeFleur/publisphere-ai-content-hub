import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ArrowUpDown,
  CreditCard,
  DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  fadeInUp,
  staggerContainer,
  staggerItem
} from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ClientManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [trialDays, setTrialDays] = useState("14");
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
        toast({
          title: "Error",
          description: "Agency not found",
          variant: "destructive",
        });
        return;
      }

      // Load clients with subscriptions
      const { data: clientsData } = await supabase
        .from('clients')
        .select(`
          *,
          client_subscriptions (
            id,
            status,
            plan_id,
            posts_used_this_month,
            next_billing_date,
            subscription_plans (
              name,
              price_monthly
            )
          )
        `)
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (clientsData) {
        setClients(clientsData);
      }

      // Load available subscription plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('is_active', true)
        .order('price_monthly');

      if (plansData) {
        setPlans(plansData);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const handleOpenSubscribeModal = (client: any) => {
    setSelectedClient(client);
    setShowSubscribeModal(true);
  };

  const handleCreateSubscription = async () => {
    if (!selectedClient || !selectedPlan) {
      toast({
        title: "Validation Error",
        description: "Please select a subscription plan",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingSubscription(true);

      const { data, error } = await supabase.functions.invoke('create-client-subscription', {
        body: {
          clientId: selectedClient.id,
          planId: selectedPlan,
          trialDays: parseInt(trialDays) || 0,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stripe checkout session created. Redirecting...",
      });

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
      setIsCreatingSubscription(false);
    }
  };

  const getSubscriptionStatus = (client: any) => {
    const subscription = client.client_subscriptions?.[0];
    if (!subscription) return null;
    return subscription.status;
  };

  const getSubscriptionBadge = (status: string | null) => {
    if (!status) return null;

    const badges: Record<string, { color: string; label: string }> = {
      active: { color: "text-green-600 bg-green-50 border-green-200", label: "Active" },
      trialing: { color: "text-blue-600 bg-blue-50 border-blue-200", label: "Trial" },
      past_due: { color: "text-orange-600 bg-orange-50 border-orange-200", label: "Past Due" },
      canceled: { color: "text-gray-600 bg-gray-50 border-gray-200", label: "Canceled" },
      unpaid: { color: "text-red-600 bg-red-50 border-red-200", label: "Unpaid" },
    };

    const badge = badges[status] || badges.canceled;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <DollarSign className="h-3 w-3" />
        {badge.label}
      </div>
    );
  };

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === "all") return matchesSearch;

      const subscriptionStatus = getSubscriptionStatus(client);
      if (filterStatus === "active") return matchesSearch && subscriptionStatus === "active";
      if (filterStatus === "inactive") return matchesSearch && !subscriptionStatus;
      if (filterStatus === "pending") return matchesSearch && subscriptionStatus === "trialing";

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.business_name || "").localeCompare(b.business_name || "");
      return 0;
    });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => {
      const status = getSubscriptionStatus(c);
      return status === "active" || status === "trialing";
    }).length,
    inactive: clients.filter((c) => !getSubscriptionStatus(c)).length,
    pending: clients.filter((c) => getSubscriptionStatus(c) === "trialing").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-foreground bg-foreground/5 border-foreground/10";
      case "inactive":
        return "text-muted-foreground bg-muted border-border";
      case "pending":
        return "text-muted-foreground bg-muted/50 border-border";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-3 w-3" />;
      case "inactive":
        return <XCircle className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="skeleton h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
          <div className="skeleton h-96 w-full" />
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
              <h1 className="text-4xl font-bold mb-2">Client Management</h1>
              <p className="text-muted-foreground text-lg">
                Manage all your client accounts in one place
              </p>
            </div>
            <Button
              className="btn-premium gap-2"
              onClick={() => navigate("/clients/new")}
            >
              <Plus className="h-5 w-5" />
              Add Client
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <Users className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Clients
                  </div>
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted border border-border rounded-lg">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.inactive}</div>
                  <div className="text-sm text-muted-foreground">Inactive</div>
                </div>
              </div>
            </Card>

            <Card className="metric-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/50 border border-border rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  className="gap-2"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "active" ? "default" : "outline"}
                  onClick={() => setFilterStatus("active")}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Active
                </Button>
                <Button
                  variant={filterStatus === "inactive" ? "default" : "outline"}
                  onClick={() => setFilterStatus("inactive")}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Inactive
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Pending
                </Button>
              </div>

              {/* Export */}
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Client Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">
                      <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                        Client Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold">
                      Contact Email
                    </th>
                    <th className="text-left p-4 font-semibold">Subscription</th>
                    <th className="text-left p-4 font-semibold">
                      Plan
                    </th>
                    <th className="text-left p-4 font-semibold">
                      Created
                    </th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredClients.map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="table-row-hover border-b border-border last:border-0"
                      >
                        <td className="p-4">
                          <div className="font-medium">{client.business_name || "Unnamed Client"}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {client.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {client.contact_email || "-"}
                        </td>
                        <td className="p-4">
                          {getSubscriptionBadge(getSubscriptionStatus(client)) || (
                            <span className="text-sm text-muted-foreground">No subscription</span>
                          )}
                        </td>
                        <td className="p-4">
                          {client.client_subscriptions?.[0]?.subscription_plans?.name ? (
                            <div>
                              <div className="font-medium text-sm">
                                {client.client_subscriptions[0].subscription_plans.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ${client.client_subscriptions[0].subscription_plans.price_monthly}/mo
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground text-sm">
                          {client.created_at ? new Date(client.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {!getSubscriptionStatus(client) ? (
                              <Button
                                variant="default"
                                size="sm"
                                className="gap-2 btn-premium"
                                onClick={() => handleOpenSubscribeModal(client)}
                              >
                                <CreditCard className="h-4 w-4" />
                                Subscribe
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() =>
                                  navigate(`/clients/${client.id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                navigate(`/clients/${client.id}/edit`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Empty State */}
              {filteredClients.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="empty-state py-16"
                >
                  <div className="p-4 bg-muted/30 border border-border rounded-full w-fit mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No clients found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first client"}
                  </p>
                  {!searchQuery && (
                    <Button
                      className="btn-premium gap-2"
                      onClick={() => navigate("/clients/new")}
                    >
                      <Plus className="h-5 w-5" />
                      Add Your First Client
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Subscribe Modal */}
        {showSubscribeModal && selectedClient && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold mb-6">
                Subscribe {selectedClient.business_name}
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="plan">Select Subscription Plan *</Label>
                  <select
                    id="plan"
                    className="mt-2 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    disabled={isCreatingSubscription}
                  >
                    <option value="">Choose a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price_monthly}/month ({plan.max_posts_per_month} posts)
                      </option>
                    ))}
                  </select>
                  {plans.length === 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No subscription plans available. Create a plan in the{" "}
                      <button
                        onClick={() => navigate("/agency/billing")}
                        className="text-foreground underline hover:no-underline"
                      >
                        billing dashboard
                      </button>
                      .
                    </p>
                  )}
                </div>

                {selectedPlan && (
                  <div className="bg-muted/30 border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Selected Plan Details:</h3>
                    {(() => {
                      const plan = plans.find((p) => p.id === selectedPlan);
                      return plan ? (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Plan:</span>
                            <span className="font-medium">{plan.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-medium">${plan.price_monthly}/month</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Posts:</span>
                            <span className="font-medium">{plan.max_posts_per_month} per month</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <div>
                  <Label htmlFor="trialDays">Trial Period (days)</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    placeholder="14"
                    className="mt-2"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    disabled={isCreatingSubscription}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional: Number of days before the first charge (0 for no trial)
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                    What happens next:
                  </h4>
                  <ol className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                    <li>1. Stripe Checkout session will be created</li>
                    <li>2. Client will be redirected to secure Stripe payment page</li>
                    <li>3. After payment, subscription will be activated automatically</li>
                    <li>4. Client can start generating content immediately</li>
                  </ol>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSubscribeModal(false);
                      setSelectedClient(null);
                      setSelectedPlan("");
                      setTrialDays("14");
                    }}
                    className="flex-1"
                    disabled={isCreatingSubscription}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="btn-premium flex-1"
                    onClick={handleCreateSubscription}
                    disabled={isCreatingSubscription || !selectedPlan}
                  >
                    {isCreatingSubscription ? "Creating..." : "Create Checkout Session"}
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

export default ClientManagement;
