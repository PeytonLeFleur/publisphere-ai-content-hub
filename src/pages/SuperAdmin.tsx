import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  Users,
  Building2,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronUp,
  LogOut,
  BarChart3,
} from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { SuperAdminAnalytics } from "@/components/super-admin/SuperAdminAnalytics";

interface Agency {
  id: string;
  business_name: string;
  contact_email: string;
  created_at: string;
  total_clients: number;
  active_subscriptions: number;
}

interface Client {
  id: string;
  business_name: string;
  industry: string;
  created_at: string;
  has_active_subscription: boolean;
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null);
  const [agencyClients, setAgencyClients] = useState<Record<string, Client[]>>(
    {}
  );
  const [stats, setStats] = useState({
    totalAgencies: 0,
    totalClients: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/super-admin/login");
        return;
      }

      // Check if user is super admin
      const { data: isSuperAdmin, error } = await supabase.rpc(
        "is_super_admin",
        {
          p_email: user.email,
        }
      );

      if (error || !isSuperAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have super admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      loadDashboardData();
    } catch (error: any) {
      console.error("Access check error:", error);
      navigate("/super-admin/login");
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load agencies
      const { data: agenciesData, error: agenciesError } = await supabase.rpc(
        "get_super_admin_agencies"
      );

      if (agenciesError) throw agenciesError;

      setAgencies(agenciesData || []);

      // Calculate stats
      const totalAgencies = agenciesData?.length || 0;
      const totalClients = agenciesData?.reduce(
        (sum, a) => sum + (a.total_clients || 0),
        0
      );
      const activeSubscriptions = agenciesData?.reduce(
        (sum, a) => sum + (a.active_subscriptions || 0),
        0
      );

      setStats({
        totalAgencies,
        totalClients,
        activeSubscriptions,
      });

      setIsLoading(false);
    } catch (error: any) {
      console.error("Dashboard load error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const loadAgencyClients = async (agencyId: string) => {
    try {
      const { data: clientsData, error } = await supabase.rpc(
        "get_super_admin_agency_clients",
        {
          p_agency_id: agencyId,
        }
      );

      if (error) throw error;

      setAgencyClients((prev) => ({
        ...prev,
        [agencyId]: clientsData || [],
      }));
    } catch (error: any) {
      console.error("Load clients error:", error);
      toast({
        title: "Error",
        description: "Failed to load agency clients",
        variant: "destructive",
      });
    }
  };

  const toggleAgency = async (agencyId: string) => {
    if (expandedAgency === agencyId) {
      setExpandedAgency(null);
    } else {
      setExpandedAgency(agencyId);
      if (!agencyClients[agencyId]) {
        await loadAgencyClients(agencyId);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/super-admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="skeleton h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                <Shield className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
                <p className="text-muted-foreground text-lg">
                  PubliSphere Platform Administration
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 p-4 bg-muted border border-border rounded-lg">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              <strong>Privacy Mode:</strong> Client data, API keys, and
              credentials are encrypted and not visible to super admins. You can
              only view agency names and client business names.
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <motion.div variants={staggerItem}>
            <Card className="metric-card">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {stats.totalAgencies}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Agencies
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="metric-card">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {stats.totalClients}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Clients
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card className="metric-card">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">
                  {stats.activeSubscriptions}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Subscriptions
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Tabs: Analytics & Agencies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="agencies" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Agencies
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <SuperAdminAnalytics />
            </TabsContent>

            {/* Agencies Tab */}
            <TabsContent value="agencies" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  Agencies
                </h2>

            {agencies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No agencies found
              </div>
            ) : (
              <div className="space-y-2">
                {agencies.map((agency) => (
                  <div
                    key={agency.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* Agency Header */}
                    <div
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => toggleAgency(agency.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {agency.business_name}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-foreground/5 border border-foreground/10 rounded">
                            {agency.total_clients} clients
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded">
                            {agency.active_subscriptions} active subscriptions
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agency.contact_email} • Joined{" "}
                          {new Date(agency.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        {expandedAgency === agency.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Client List */}
                    {expandedAgency === agency.id && (
                      <div className="border-t border-border bg-muted/20 p-4">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Clients ({agency.total_clients})
                        </h4>

                        {agencyClients[agency.id]?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No clients yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {agencyClients[agency.id]?.map((client) => (
                              <div
                                key={client.id}
                                className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                              >
                                <div>
                                  <div className="font-medium">
                                    {client.business_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {client.industry || "No industry specified"}{" "}
                                    • Added{" "}
                                    {new Date(
                                      client.created_at
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                                {client.has_active_subscription && (
                                  <span className="text-xs px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 p-3 bg-muted border border-border rounded-lg">
                          <div className="flex items-start gap-2">
                            <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="text-xs text-muted-foreground">
                              <strong>Privacy Protected:</strong> Contact
                              details, addresses, notes, API keys, and all other
                              sensitive client data are encrypted and not
                              accessible to super admins.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>
      </div>
    </div>
  );
};

export default SuperAdmin;
