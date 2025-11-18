import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Phone, Pause, Play, Trash2, Edit, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import type { VoiceAgent } from "@/types/voiceAgent";

interface VoiceAgentDashboardProps {
  clientId?: string;
  onEdit?: (agentId: string) => void;
  onViewAnalytics?: (agentId: string) => void;
}

export const VoiceAgentDashboard = ({ clientId, onEdit, onViewAnalytics }: VoiceAgentDashboardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);

  useEffect(() => {
    loadVoiceAgents();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('voice_agents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_agents',
          filter: clientId ? `client_id=eq.${clientId}` : undefined,
        },
        () => {
          loadVoiceAgents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clientId]);

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
        .select(`
          *,
          clients (
            business_name,
            contact_name
          ),
          voice_agent_phone_numbers (
            phone_number,
            friendly_name
          )
        `)
        .eq('agency_id', agency.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVoiceAgents(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading voice agents:', error);
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('voice_agents')
        .update({ status: newStatus })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Voice agent ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      loadVoiceAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update voice agent status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('delete-voice-agent', {
        body: { voice_agent_id: agentId },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Voice agent deleted successfully",
      });

      loadVoiceAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete voice agent",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
    }
    return number;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6" />
          Voice Agents
        </h3>
        <p className="text-muted-foreground mt-1">
          Manage and monitor your AI voice agents
        </p>
      </div>

      {voiceAgents.length === 0 ? (
        <Card className="p-12 text-center">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No voice agents yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first AI voice agent to start handling customer calls automatically
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {voiceAgents.map((agent) => (
            <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-bold">{agent.name}</h4>
                    {getStatusBadge(agent.status)}
                    {agent.use_knowledge_base && (
                      <Badge variant="outline" className="text-xs">
                        Knowledge Base Enabled
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {(agent as any).clients && (
                      <span>
                        Client: <strong>{(agent as any).clients.business_name}</strong>
                      </span>
                    )}
                    {agent.voice_name && (
                      <span>Voice: {agent.voice_name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(agent.id, agent.status)}
                  >
                    {agent.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>

                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(agent.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(agent.id, agent.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Phone Number */}
              {(agent as any).voice_agent_phone_numbers && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-mono font-semibold">
                    {formatPhoneNumber((agent as any).voice_agent_phone_numbers.phone_number)}
                  </span>
                  {(agent as any).voice_agent_phone_numbers.friendly_name && (
                    <span className="text-sm text-muted-foreground">
                      ({(agent as any).voice_agent_phone_numbers.friendly_name})
                    </span>
                  )}
                </div>
              )}

              {/* System Prompt Preview */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">System Prompt:</p>
                <p className="text-sm line-clamp-2 p-3 bg-muted rounded-lg font-mono">
                  {agent.system_prompt}
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">{agent.total_calls}</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Minutes</p>
                  <p className="text-2xl font-bold">{agent.total_minutes.toFixed(1)}</p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">
                    {agent.total_calls > 0
                      ? `${Math.round((agent.total_minutes / agent.total_calls) * 60)}s`
                      : '0s'}
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Last Call</p>
                  <p className="text-sm font-semibold">
                    {agent.last_call_at
                      ? new Date(agent.last_call_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Settings Summary */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
                <span>Max Duration: {Math.floor(agent.max_duration_seconds / 60)}m</span>
                <span>•</span>
                <span>Recording: {agent.recording_enabled ? 'Enabled' : 'Disabled'}</span>
                <span>•</span>
                <span>Transcription: {agent.transcription_enabled ? 'Enabled' : 'Disabled'}</span>
                {agent.transfer_phone_number && (
                  <>
                    <span>•</span>
                    <span>Transfer to: {formatPhoneNumber(agent.transfer_phone_number)}</span>
                  </>
                )}
              </div>

              {/* View Analytics Button */}
              {onViewAnalytics && agent.total_calls > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onViewAnalytics(agent.id)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Call Analytics
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {voiceAgents.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h4 className="font-semibold mb-4">Overall Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <p className="text-3xl font-bold">
                {voiceAgents.filter(a => a.status === 'active').length}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-3xl font-bold">
                {voiceAgents.reduce((sum, a) => sum + a.total_calls, 0)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Minutes</p>
              <p className="text-3xl font-bold">
                {voiceAgents.reduce((sum, a) => sum + a.total_minutes, 0).toFixed(1)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Agents with KB</p>
              <p className="text-3xl font-bold">
                {voiceAgents.filter(a => a.use_knowledge_base).length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
};
