import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Calendar, Settings, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const ClientDashboard = () => {
  // Mock data - would come from database in real implementation
  const clientData = {
    businessName: "Acme Corp",
    articlesPublished: 24,
    gmbPosts: 15,
    scheduledContent: 8
  };

  // Mock agency branding
  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar agencyBranding={agencyBranding} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground text-lg">{clientData.businessName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Articles Published"
            value={clientData.articlesPublished}
            icon={FileText}
            description="Last 30 days"
          />
          <StatsCard
            title="GMB Posts"
            value={clientData.gmbPosts}
            icon={TrendingUp}
            description="This month"
          />
          <StatsCard
            title="Scheduled"
            value={clientData.scheduledContent}
            icon={Clock}
            description="Upcoming content"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/generate">
              <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Generate Content</h3>
                    <p className="text-sm text-muted-foreground">Create new articles and posts</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">View Calendar</h3>
                  <p className="text-sm text-muted-foreground">Manage scheduled content</p>
                </div>
              </div>
            </Card>

            <Link to="/settings/wordpress">
              <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Settings className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">WordPress</h3>
                    <p className="text-sm text-muted-foreground">Connect WordPress sites</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Content Overview */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Content</h2>
          <Card className="p-6 glass-effect">
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No content yet</p>
              <p className="text-sm">Generate your first piece of content to get started</p>
              <Button className="mt-4">Generate Content</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
