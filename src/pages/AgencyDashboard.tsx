import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, UserPlus, Settings, FileText, TrendingUp, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const AgencyDashboard = () => {
  // Mock data - would come from database in real implementation
  const agencyData = {
    name: "My Marketing Agency",
    totalClients: 12,
    activeClients: 10,
    contentGenerated: 248
  };

  const recentActivity = [
    { action: "New client added", client: "Acme Corp", time: "2 hours ago" },
    { action: "Content published", client: "Tech Startup", time: "5 hours ago" },
    { action: "API key verified", client: "Local Business", time: "1 day ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground text-lg">{agencyData.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Clients"
            value={agencyData.totalClients}
            icon={Users}
            description="All registered clients"
          />
          <StatsCard
            title="Active Clients"
            value={agencyData.activeClients}
            icon={TrendingUp}
            description="Clients with active subscriptions"
          />
          <StatsCard
            title="Content Generated"
            value={agencyData.contentGenerated}
            icon={FileText}
            description="Total pieces this month"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Add New Client</h3>
                  <p className="text-sm text-muted-foreground">Create a new client account</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">View All Clients</h3>
                  <p className="text-sm text-muted-foreground">Manage your client list</p>
                </div>
              </div>
            </Card>

            <Link to="/agency/settings">
              <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Settings className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">White Label Settings</h3>
                    <p className="text-sm text-muted-foreground">Customize your branding</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          <Card className="p-6 glass-effect">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.client}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;
