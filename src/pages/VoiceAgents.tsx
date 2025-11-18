import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { VoiceAgentSetup } from "@/components/voice/VoiceAgentSetup";
import { PhoneNumberManager } from "@/components/voice/PhoneNumberManager";
import { VoiceAgentDashboard } from "@/components/voice/VoiceAgentDashboard";
import { CallLogsDashboard } from "@/components/voice/CallLogsDashboard";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

const VoiceAgents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleViewAnalytics = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab("analytics");
  };

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
            onClick={() => navigate('/agency/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agency Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Voice Agents</h1>
            <p className="text-muted-foreground text-lg">
              Create and manage AI-powered voice agents for your clients
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="setup">API Setup</TabsTrigger>
              <TabsTrigger value="phone-numbers">Phone Numbers</TabsTrigger>
              <TabsTrigger value="analytics">Call Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <VoiceAgentDashboard onViewAnalytics={handleViewAnalytics} />
            </TabsContent>

            <TabsContent value="setup" className="space-y-6">
              <VoiceAgentSetup />
            </TabsContent>

            <TabsContent value="phone-numbers" className="space-y-6">
              <PhoneNumberManager />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <CallLogsDashboard voiceAgentId={selectedAgentId || undefined} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceAgents;
