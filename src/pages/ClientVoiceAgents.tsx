import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VoiceAgentBuilder } from "@/components/voice/VoiceAgentBuilder";
import { VoiceAgentDashboard } from "@/components/voice/VoiceAgentDashboard";
import { CallLogsDashboard } from "@/components/voice/CallLogsDashboard";
import { KnowledgeBaseManager } from "@/components/voice/KnowledgeBaseManager";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

const ClientVoiceAgents = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("agents");
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClientData();
      checkCredentials();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      setClient(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading client:', error);
      setIsLoading(false);
    }
  };

  const checkCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', user.email)
        .single();

      if (!agency) return;

      // Check if agency has both Twilio and ElevenLabs credentials
      const { data: twilioData } = await supabase
        .from('twilio_credentials')
        .select('is_verified')
        .eq('agency_id', agency.id)
        .single();

      const { data: elevenLabsData } = await supabase
        .from('elevenlabs_credentials')
        .select('is_verified')
        .eq('agency_id', agency.id)
        .single();

      setHasCredentials(
        twilioData?.is_verified === true && elevenLabsData?.is_verified === true
      );
    } catch (error) {
      console.error('Error checking credentials:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="skeleton h-12 w-64" />
          <div className="skeleton h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h2 className="text-2xl font-bold mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The client you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/clients')}>
              Back to Clients
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(`/clients/${clientId}`)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Client Details
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Voice Agents for {client.business_name}
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage AI voice agents and knowledge base for this client
            </p>
          </div>

          {/* Credentials Warning */}
          {!hasCredentials && (
            <Card className="p-6 mb-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                    API Credentials Required
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                    You need to configure your Twilio and ElevenLabs credentials before creating voice agents.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/voice-agents?tab=setup')}
                    className="border-orange-300 dark:border-orange-700"
                  >
                    Configure API Credentials
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="agents">Voice Agents</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
              <TabsTrigger value="analytics">Call History</TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-6">
              <VoiceAgentDashboard
                clientId={clientId}
                onViewAnalytics={() => setActiveTab("analytics")}
              />
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              {hasCredentials ? (
                <VoiceAgentBuilder
                  clientId={clientId!}
                  onSuccess={() => setActiveTab("agents")}
                />
              ) : (
                <Card className="p-12 text-center">
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 text-orange-600" />
                  <h3 className="text-xl font-semibold mb-2">API Setup Required</h3>
                  <p className="text-muted-foreground mb-6">
                    Please configure your API credentials before creating voice agents.
                  </p>
                  <Button
                    onClick={() => navigate('/voice-agents?tab=setup')}
                    className="btn-premium"
                  >
                    Go to API Setup
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="knowledge" className="space-y-6">
              <KnowledgeBaseManager clientId={clientId!} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <CallLogsDashboard clientId={clientId} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientVoiceAgents;
