import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  FileText,
  Phone,
  CreditCard,
  DollarSign,
  Clock,
  BarChart3,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

interface OverviewStats {
  total_agencies: number;
  new_agencies_period: number;
  total_clients: number;
  new_clients_period: number;
  total_content: number;
  new_content_period: number;
  total_articles: number;
  total_gmb_posts: number;
  total_social_posts: number;
  total_voice_agents: number;
  new_voice_agents_period: number;
  total_voice_calls: number;
  total_call_minutes: number;
  active_subscriptions: number;
  total_revenue_monthly: number;
}

interface GrowthMetrics {
  period: string;
  agencies_added: number;
  clients_added: number;
  content_created: number;
  subscriptions_added: number;
  growth_rate_agencies: number;
  growth_rate_clients: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

interface CallAnalytics {
  total_calls: number;
  total_minutes: number;
  avg_duration_seconds: number;
  successful_calls: number;
  failed_calls: number;
}

type TimePeriod = "today" | "7days" | "30days" | "90days" | "all";

const COLORS = {
  primary: "hsl(var(--foreground))",
  secondary: "hsl(var(--muted-foreground))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

const CHART_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export const SuperAdminAnalytics = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30days");
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [callAnalytics, setCallAnalytics] = useState<CallAnalytics | null>(null);
  const [agenciesTimeSeries, setAgenciesTimeSeries] = useState<TimeSeriesData[]>([]);
  const [clientsTimeSeries, setClientsTimeSeries] = useState<TimeSeriesData[]>([]);
  const [contentTimeSeries, setContentTimeSeries] = useState<TimeSeriesData[]>([]);
  const [callsTimeSeries, setCallsTimeSeries] = useState<TimeSeriesData[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timePeriod]);

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (timePeriod) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "7days":
        start.setDate(start.getDate() - 7);
        break;
      case "30days":
        start.setDate(start.getDate() - 30);
        break;
      case "90days":
        start.setDate(start.getDate() - 90);
        break;
      case "all":
        start = new Date("2020-01-01"); // Beginning of time for this app
        break;
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const { start, end } = getDateRange();

      // Load overview stats
      const { data: overview, error: overviewError } = await supabase.rpc(
        "get_super_admin_overview_stats",
        {
          p_start_date: timePeriod === "all" ? null : start,
          p_end_date: end,
        }
      );

      if (overviewError) throw overviewError;
      setOverviewStats(overview[0]);

      // Load growth metrics
      const days = timePeriod === "7days" ? 7 : timePeriod === "90days" ? 90 : 30;
      const { data: growth, error: growthError } = await supabase.rpc(
        "get_super_admin_growth_metrics",
        { p_days: days }
      );

      if (growthError) throw growthError;
      setGrowthMetrics(growth[0]);

      // Load call analytics
      const { data: calls, error: callsError } = await supabase.rpc(
        "get_super_admin_call_analytics",
        {
          p_start_date: timePeriod === "all" ? null : start,
          p_end_date: end,
        }
      );

      if (callsError) throw callsError;
      setCallAnalytics(calls[0]);

      // Load time series data
      const [agenciesTs, clientsTs, contentTs, callsTs] = await Promise.all([
        supabase.rpc("get_super_admin_time_series", {
          p_metric_type: "agencies",
          p_start_date: start,
          p_end_date: end,
        }),
        supabase.rpc("get_super_admin_time_series", {
          p_metric_type: "clients",
          p_start_date: start,
          p_end_date: end,
        }),
        supabase.rpc("get_super_admin_time_series", {
          p_metric_type: "content",
          p_start_date: start,
          p_end_date: end,
        }),
        supabase.rpc("get_super_admin_time_series", {
          p_metric_type: "voice_calls",
          p_start_date: start,
          p_end_date: end,
        }),
      ]);

      if (agenciesTs.data) setAgenciesTimeSeries(agenciesTs.data);
      if (clientsTs.data) setClientsTimeSeries(clientsTs.data);
      if (contentTs.data) setContentTimeSeries(contentTs.data);
      if (callsTs.data) setCallsTimeSeries(callsTs.data);

      setIsLoading(false);
    } catch (error: any) {
      console.error("Analytics load error:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    change,
    changeLabel,
    trend,
    color = "primary",
  }: {
    icon: any;
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    trend?: "up" | "down";
    color?: string;
  }) => (
    <Card className="metric-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-${color}-50 border border-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm ${
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            {trend === "up" && <TrendingUp className="h-4 w-4" />}
            {trend === "down" && <TrendingDown className="h-4 w-4" />}
            <span className="font-medium">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
        {changeLabel && (
          <div className="text-xs text-muted-foreground mt-1">{changeLabel}</div>
        )}
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!overviewStats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No analytics data available
      </div>
    );
  }

  const contentBreakdown = [
    { name: "Articles", value: overviewStats.total_articles, color: CHART_COLORS[0] },
    { name: "GMB Posts", value: overviewStats.total_gmb_posts, color: CHART_COLORS[1] },
    { name: "Social Posts", value: overviewStats.total_social_posts, color: CHART_COLORS[2] },
  ];

  return (
    <div className="space-y-8">
      {/* Time Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive platform metrics and insights
          </p>
        </div>
        <div className="flex gap-2">
          {(["today", "7days", "30days", "90days", "all"] as TimePeriod[]).map((period) => (
            <Button
              key={period}
              variant={timePeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod(period)}
            >
              {period === "today" && "Today"}
              {period === "7days" && "7 Days"}
              {period === "30days" && "30 Days"}
              {period === "90days" && "90 Days"}
              {period === "all" && "All Time"}
            </Button>
          ))}
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Building2}
          title="Total Agencies"
          value={overviewStats.total_agencies.toLocaleString()}
          change={growthMetrics?.growth_rate_agencies}
          changeLabel={`${overviewStats.new_agencies_period} new this period`}
          trend={growthMetrics && growthMetrics.growth_rate_agencies > 0 ? "up" : "down"}
          color="purple"
        />
        <MetricCard
          icon={Users}
          title="Total Clients"
          value={overviewStats.total_clients.toLocaleString()}
          change={growthMetrics?.growth_rate_clients}
          changeLabel={`${overviewStats.new_clients_period} new this period`}
          trend={growthMetrics && growthMetrics.growth_rate_clients > 0 ? "up" : "down"}
          color="blue"
        />
        <MetricCard
          icon={FileText}
          title="Content Created"
          value={overviewStats.total_content.toLocaleString()}
          changeLabel={`${overviewStats.new_content_period} new this period`}
          color="green"
        />
        <MetricCard
          icon={CreditCard}
          title="Active Subscriptions"
          value={overviewStats.active_subscriptions.toLocaleString()}
          color="orange"
        />
      </div>

      {/* Voice Agent Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Phone}
          title="Voice Agents"
          value={overviewStats.total_voice_agents.toLocaleString()}
          changeLabel={`${overviewStats.new_voice_agents_period} new this period`}
          color="indigo"
        />
        <MetricCard
          icon={Activity}
          title="Total Calls"
          value={callAnalytics?.total_calls.toLocaleString() || "0"}
          color="cyan"
        />
        <MetricCard
          icon={Clock}
          title="Call Minutes"
          value={Math.round(overviewStats.total_call_minutes).toLocaleString()}
          changeLabel={`Avg ${Math.round(callAnalytics?.avg_duration_seconds || 0)}s per call`}
          color="teal"
        />
        <MetricCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`$${overviewStats.total_revenue_monthly.toLocaleString()}`}
          color="emerald"
        />
      </div>

      {/* Charts Row 1: Agencies & Clients Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agencies Over Time */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agency Signups
            </h3>
            <p className="text-sm text-muted-foreground">New agencies over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={agenciesTimeSeries}>
                <defs>
                  <linearGradient id="colorAgencies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorAgencies)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Clients Over Time */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Growth
            </h3>
            <p className="text-sm text-muted-foreground">New clients over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clientsTimeSeries}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorClients)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2: Content & Voice Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Generation */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Generation
            </h3>
            <p className="text-sm text-muted-foreground">
              Content created over time
            </p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Voice Calls */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Voice Call Activity
            </h3>
            <p className="text-sm text-muted-foreground">Calls handled over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={callsTimeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Content Breakdown & Call Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Breakdown */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Content Type Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Breakdown by content type
            </p>
          </div>
          <div className="flex items-center justify-center" style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {contentBreakdown.map((item, index) => (
              <div key={index} className="text-center">
                <div
                  className="h-2 w-full rounded-full mb-2"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{item.name}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Call Success Rate */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Call Performance
            </h3>
            <p className="text-sm text-muted-foreground">
              Success rate and duration metrics
            </p>
          </div>
          <div className="space-y-6">
            {/* Success Rate */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-2xl font-bold">
                  {callAnalytics && callAnalytics.total_calls > 0
                    ? (
                        (callAnalytics.successful_calls / callAnalytics.total_calls) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width:
                      callAnalytics && callAnalytics.total_calls > 0
                        ? `${(callAnalytics.successful_calls / callAnalytics.total_calls) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{callAnalytics?.successful_calls} successful</span>
                <span>{callAnalytics?.failed_calls} failed</span>
              </div>
            </div>

            {/* Average Duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Call Duration</span>
                <span className="text-2xl font-bold">
                  {Math.round(callAnalytics?.avg_duration_seconds || 0)}s
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {callAnalytics?.total_calls.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {Math.round(callAnalytics?.total_minutes || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {callAnalytics
                      ? (callAnalytics.total_minutes / 60).toFixed(1)
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Hours</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Growth Summary */}
      {growthMetrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Growth Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-purple-50 border border-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {growthMetrics.agencies_added}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Agencies Added</div>
              <div
                className={`text-xs mt-2 ${growthMetrics.growth_rate_agencies > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {growthMetrics.growth_rate_agencies > 0 ? "+" : ""}
                {growthMetrics.growth_rate_agencies.toFixed(1)}% vs previous period
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {growthMetrics.clients_added}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Clients Added</div>
              <div
                className={`text-xs mt-2 ${growthMetrics.growth_rate_clients > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {growthMetrics.growth_rate_clients > 0 ? "+" : ""}
                {growthMetrics.growth_rate_clients.toFixed(1)}% vs previous period
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 border border-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {growthMetrics.content_created}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Content Created</div>
            </div>
            <div className="text-center p-4 bg-orange-50 border border-orange-100 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {growthMetrics.subscriptions_added}
              </div>
              <div className="text-sm text-muted-foreground mt-1">New Subscriptions</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
