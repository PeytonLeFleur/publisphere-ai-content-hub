import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, TrendingUp, TrendingDown, Clock, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import type { VoiceCall, VoiceAgent, CallAnalytics } from "@/types/voiceAgent";

interface CallLogsDashboardProps {
  clientId?: string;
  voiceAgentId?: string;
}

export const CallLogsDashboard = ({ clientId, voiceAgentId }: CallLogsDashboardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>(voiceAgentId || "all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);

  const limit = 20;

  useEffect(() => {
    loadVoiceAgents();
  }, [clientId]);

  useEffect(() => {
    loadCallLogs();
  }, [clientId, selectedAgent, selectedStatus, currentPage]);

  const loadVoiceAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', user.email)
        .single();

      if (!agency) return;

      let query = supabase
        .from('voice_agents')
        .select('*')
        .eq('agency_id', agency.id)
        .neq('status', 'deleted');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVoiceAgents(data || []);
    } catch (error) {
      console.error('Error loading voice agents:', error);
    }
  };

  const loadCallLogs = async () => {
    try {
      const params = new URLSearchParams();

      if (selectedAgent && selectedAgent !== 'all') {
        params.append('voice_agent_id', selectedAgent);
      } else if (clientId) {
        params.append('client_id', clientId);
      }

      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      params.append('limit', limit.toString());
      params.append('offset', (currentPage * limit).toString());

      const { data, error } = await supabase.functions.invoke(
        `get-call-logs?${params.toString()}`,
        { method: 'GET' }
      );

      if (error) throw error;

      if (data.success) {
        setCalls(data.calls || []);
        setAnalytics(data.analytics);
        setTotalCalls(data.pagination?.total || 0);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading call logs:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load call logs",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatPhoneNumber = (number: string) => {
    // Format E.164 to (XXX) XXX-XXXX
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    return number;
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">Completed</span>;
      case 'no-answer':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300">No Answer</span>;
      case 'busy':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300">Busy</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300">Failed</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300">{status || 'Unknown'}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCalls / limit);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Phone className="h-6 w-6" />
          Call Logs & Analytics
        </h3>
        <p className="text-muted-foreground mt-1">
          Track and analyze your voice agent call history
        </p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-3xl font-bold mt-1">{analytics.total_calls}</p>
              </div>
              <Phone className="h-8 w-8 text-primary opacity-50" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <span className="text-green-600 dark:text-green-400">
                {analytics.answered_calls} answered
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-orange-600 dark:text-orange-400">
                {analytics.missed_calls} missed
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
                <p className="text-3xl font-bold mt-1">{analytics.total_minutes.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-50" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              Avg: {Math.floor(analytics.avg_duration_seconds / 60)}m {analytics.avg_duration_seconds % 60}s per call
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-3xl font-bold mt-1">{analytics.total_cost || '$0.00'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-50" />
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              Twilio + ElevenLabs combined
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sentiment</p>
                <div className="flex items-center gap-2 mt-1">
                  {analytics.sentiment_distribution && (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        {analytics.sentiment_distribution.positive}
                      </span>
                      <TrendingDown className="h-5 w-5 text-red-600 ml-2" />
                      <span className="text-xl font-bold text-red-600">
                        {analytics.sentiment_distribution.negative}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              Positive vs Negative calls
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {voiceAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={loadCallLogs}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Call Logs Table */}
      {calls.length === 0 ? (
        <Card className="p-12 text-center">
          <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No calls yet</h3>
          <p className="text-muted-foreground">
            Call logs will appear here once your voice agents start receiving calls
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {calls.map((call) => (
              <Card key={call.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-semibold">
                        {call.direction === 'inbound' ? 'From' : 'To'}: {formatPhoneNumber(call.from_number)}
                      </h4>
                      {getStatusBadge(call.status)}
                      {call.sentiment && (
                        <span className={`text-sm font-medium capitalize ${getSentimentColor(call.sentiment)}`}>
                          {call.sentiment}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Agent</p>
                        <p className="font-medium">{(call as any).voice_agents?.name || 'Unknown'}</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{formatDuration(call.duration_seconds)}</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Cost</p>
                        <p className="font-medium">
                          {call.total_cost_cents ? `$${(call.total_cost_cents / 100).toFixed(2)}` : '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {call.started_at ? new Date(call.started_at).toLocaleString() : '-'}
                        </p>
                      </div>
                    </div>

                    {call.summary && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{call.summary}</p>
                      </div>
                    )}

                    {call.key_topics && call.key_topics.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-muted-foreground">Topics:</span>
                        {call.key_topics.slice(0, 5).map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {call.transcript && Array.isArray(call.transcript) && call.transcript.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                          View Transcript ({call.transcript.length} messages)
                        </summary>
                        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto p-3 bg-muted rounded-lg">
                          {call.transcript.map((msg: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              <span className="font-semibold">
                                {msg.role === 'user' ? 'Caller' : 'Agent'}:
                              </span>{' '}
                              {msg.content}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {call.recording_url && (
                      <div className="mt-3">
                        <audio controls className="w-full max-w-md">
                          <source src={call.recording_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * limit + 1} - {Math.min((currentPage + 1) * limit, totalCalls)} of {totalCalls} calls
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};
