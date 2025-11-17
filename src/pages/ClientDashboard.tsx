import { ClientLayout } from "@/components/ClientLayout";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Calendar as CalendarIcon, Settings, Sparkles, TrendingUp, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const ClientDashboard = () => {
  const [stats, setStats] = useState({
    articlesThisMonth: 0,
    gmbPostsThisMonth: 0,
    scheduledContent: 0,
    wordpressSites: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: articles } = await supabase
      .from("content_items")
      .select("*", { count: "exact" })
      .eq("type", "blog_article")
      .gte("created_at", startOfMonth.toISOString());

    const { data: gmbPosts } = await supabase
      .from("content_items")
      .select("*", { count: "exact" })
      .eq("type", "gmb_post")
      .gte("created_at", startOfMonth.toISOString());

    const { data: scheduled } = await supabase
      .from("content_items")
      .select("*", { count: "exact" })
      .eq("status", "scheduled");

    const { data: sites } = await supabase
      .from("wordpress_sites")
      .select("*", { count: "exact" });

    setStats({
      articlesThisMonth: articles?.length || 0,
      gmbPostsThisMonth: gmbPosts?.length || 0,
      scheduledContent: scheduled?.length || 0,
      wordpressSites: sites?.length || 0
    });

    // Fetch recent activity
    const { data: recent } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentActivity(recent || []);
  };

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground text-lg">Here's what's happening today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <StatsCard
            title="Articles This Month"
            value={stats.articlesThisMonth}
            icon={FileText}
            description="Published & drafted"
          />
          <StatsCard
            title="GMB Posts This Month"
            value={stats.gmbPostsThisMonth}
            icon={TrendingUp}
            description="Created this month"
          />
          <StatsCard
            title="Scheduled Content"
            value={stats.scheduledContent}
            icon={Clock}
            description="Ready to publish"
          />
          <StatsCard
            title="WordPress Sites"
            value={stats.wordpressSites}
            icon={Settings}
            description="Connected sites"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Link to="/generate">
              <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Generate Article</h3>
                    <p className="text-xs text-muted-foreground">Create SEO content</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/gmb-posts">
              <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">GMB Post</h3>
                    <p className="text-xs text-muted-foreground">Quick social post</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/content">
              <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">View All Content</h3>
                    <p className="text-xs text-muted-foreground">Browse library</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/calendar">
              <Card className="p-6 glass-effect hover:shadow-premium transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Calendar</h3>
                    <p className="text-xs text-muted-foreground">View schedule</p>
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
            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No activity yet</p>
                <p className="text-sm">Generate your first piece of content to get started</p>
                <Button asChild className="mt-4">
                  <Link to="/generate">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <Link
                    key={item.id}
                    to={`/content/${item.id}`}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-1">
                      {item.type === "gmb_post" ? (
                        <TrendingUp className="h-5 w-5 text-secondary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">
                        {item.status === "published" ? "Published" : "Created"}: {item.title || "Untitled"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
