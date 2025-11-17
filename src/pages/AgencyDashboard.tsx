import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  fadeInScale
} from "@/lib/animations";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const AgencyDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - will be replaced with real data from Supabase
  const metrics = [
    {
      icon: Users,
      label: "Active Clients",
      value: "12",
      change: "+3",
      changeType: "positive" as const,
      delay: 0,
    },
    {
      icon: FileText,
      label: "Posts Generated",
      value: "247",
      change: "+42",
      changeType: "positive" as const,
      delay: 0.1,
    },
    {
      icon: Calendar,
      label: "Posts Scheduled",
      value: "38",
      change: "+12",
      changeType: "positive" as const,
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      label: "Engagement Rate",
      value: "94%",
      change: "+5%",
      changeType: "positive" as const,
      delay: 0.3,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      client: "Tech Startup Inc",
      action: "Generated 5 blog posts",
      time: "2 hours ago",
      status: "completed",
    },
    {
      id: 2,
      client: "Marketing Agency Co",
      action: "Scheduled 3 social posts",
      time: "4 hours ago",
      status: "scheduled",
    },
    {
      id: 3,
      client: "E-commerce Store",
      action: "Published 2 articles",
      time: "Yesterday",
      status: "completed",
    },
  ];

  const chartData = [
    { date: "Mon", posts: 12 },
    { date: "Tue", posts: 19 },
    { date: "Wed", posts: 15 },
    { date: "Thu", posts: 25 },
    { date: "Fri", posts: 22 },
    { date: "Sat", posts: 18 },
    { date: "Sun", posts: 20 },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Loading Skeletons */}
          <div className="skeleton h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 skeleton h-96" />
            <div className="skeleton h-96" />
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back! <span className="gradient-text">✨</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Here's what's happening with your content automation today.
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
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                variants={staggerItem}
                custom={index}
              >
                <Card className="metric-card group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg group-hover:bg-foreground/10 transition-colors">
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className={
                        metric.changeType === "positive"
                          ? "text-foreground font-medium"
                          : "text-muted-foreground"
                      }>
                        {metric.change}
                      </span>
                      <TrendingUp className="h-3 w-3 text-foreground" />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {metric.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.label}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <motion.div
            variants={fadeInScale}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            <Card className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    Content Performance
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Posts generated this week
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-foreground animate-pulse-subtle" />
                  Live
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--foreground))"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--foreground))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="posts"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={2}
                      fill="url(#colorPosts)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            variants={fadeInScale}
            initial="hidden"
            animate="visible"
          >
            <Card className="card-premium p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
              <div className="space-y-4 custom-scrollbar max-h-80 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className={
                      activity.status === "completed"
                        ? "p-2 bg-foreground/5 border border-foreground/10 rounded-lg"
                        : "p-2 bg-muted border border-border rounded-lg"
                    }>
                      {activity.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-foreground" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-0.5 truncate">
                        {activity.client}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {activity.action}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full mt-4 group"
                onClick={() => navigate("/activity")}
              >
                View All Activity
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="card-premium p-6 cursor-pointer" onClick={() => navigate("/generate")}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Generate Content</h3>
                <p className="text-sm text-muted-foreground">
                  Create AI-powered content for your clients
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>

          <Card className="card-premium p-6 cursor-pointer" onClick={() => navigate("/clients")}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Manage Clients</h3>
                <p className="text-sm text-muted-foreground">
                  View and configure your client accounts
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>

          <Card className="card-premium p-6 cursor-pointer" onClick={() => navigate("/schedule")}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                <Calendar className="h-6 w-6 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Schedule Posts</h3>
                <p className="text-sm text-muted-foreground">
                  Plan and schedule your content calendar
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AgencyDashboard;
