import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Save, Play } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { ELEVENLABS_PRESET_VOICES } from "@/types/voiceAgent";
import type { VoiceAgentFormData, VoiceAgentPhoneNumber } from "@/types/voiceAgent";

interface VoiceAgentBuilderProps {
  clientId: string;
  onSuccess?: () => void;
}

export const VoiceAgentBuilder = ({ clientId, onSuccess }: VoiceAgentBuilderProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePhoneNumbers, setAvailablePhoneNumbers] = useState<VoiceAgentPhoneNumber[]>([]);

  const [formData, setFormData] = useState<VoiceAgentFormData>({
    name: "",
    client_id: clientId,
    phone_number_id: null,
    system_prompt: "",
    first_message: "Hello! How can I help you today?",
    voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel by default
    voice_name: "Rachel",
    transfer_phone_number: null,
    recording_enabled: true,
    transcription_enabled: true,
    max_duration_seconds: 600,
    use_knowledge_base: true,
  });

  useEffect(() => {
    loadAvailablePhoneNumbers();
  }, []);

  const loadAvailablePhoneNumbers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', user.email)
        .single();

      if (!agency) return;

      // Get phone numbers that are either unassigned or assigned to this client
      const { data, error } = await supabase
        .from('voice_agent_phone_numbers')
        .select('*')
        .eq('agency_id', agency.id)
        .eq('status', 'active')
        .or(`client_id.is.null,client_id.eq.${clientId}`);

      if (error) throw error;

      setAvailablePhoneNumbers(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      setIsLoading(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    const selectedVoice = ELEVENLABS_PRESET_VOICES.find((v) => v.voice_id === voiceId);
    setFormData({
      ...formData,
      voice_id: voiceId,
      voice_name: selectedVoice?.name || null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.system_prompt || !formData.voice_id) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-voice-agent', {
        body: formData,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Voice agent "${formData.name}" created successfully`,
        });

        // Reset form
        setFormData({
          name: "",
          client_id: clientId,
          phone_number_id: null,
          system_prompt: "",
          first_message: "Hello! How can I help you today?",
          voice_id: "21m00Tcm4TlvDq8ikWAM",
          voice_name: "Rachel",
          transfer_phone_number: null,
          recording_enabled: true,
          transcription_enabled: true,
          max_duration_seconds: 600,
          use_knowledge_base: true,
        });

        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create voice agent",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testPrompt = () => {
    if (!formData.system_prompt) {
      toast({
        title: "No system prompt",
        description: "Please enter a system prompt to test",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "System Prompt Preview",
      description: formData.system_prompt.substring(0, 200) + (formData.system_prompt.length > 200 ? "..." : ""),
    });
  };

  if (isLoading) {
    return <div className="skeleton h-96 w-full" />;
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6" />
          Create Voice Agent
        </h3>
        <p className="text-muted-foreground mt-1">
          Configure your AI voice agent settings
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Basic Information</h4>

          <div>
            <Label htmlFor="name">
              Agent Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Customer Support Agent, Sales Assistant"
              className="mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone_number">Phone Number (Optional)</Label>
            <Select
              value={formData.phone_number_id || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, phone_number_id: value === "none" ? null : value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a phone number" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No phone number (assign later)</SelectItem>
                {availablePhoneNumbers.map((number) => (
                  <SelectItem key={number.id} value={number.id}>
                    {number.phone_number}
                    {number.friendly_name && ` (${number.friendly_name})`}
                    {!number.client_id && " - Unassigned"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availablePhoneNumbers.length === 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                No available phone numbers. Provision one in the Phone Numbers tab.
              </p>
            )}
          </div>
        </div>

        {/* AI Configuration */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">AI Configuration</h4>

          <div>
            <Label htmlFor="system_prompt">
              System Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="You are a helpful customer support agent for [Business Name]. Your role is to assist customers with..."
              className="mt-2 min-h-32 font-mono text-sm"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Define the agent's personality, role, and guidelines
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testPrompt}
              >
                <Play className="h-3 w-3 mr-2" />
                Preview
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="first_message">First Message</Label>
            <Input
              id="first_message"
              value={formData.first_message}
              onChange={(e) => setFormData({ ...formData, first_message: e.target.value })}
              placeholder="Hello! How can I help you today?"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              What the agent says when answering the call
            </p>
          </div>

          <div>
            <Label htmlFor="voice_id">Voice</Label>
            <Select
              value={formData.voice_id}
              onValueChange={handleVoiceChange}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ELEVENLABS_PRESET_VOICES.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    <div className="flex flex-col">
                      <span>{voice.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {voice.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Call Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Call Settings</h4>

          <div>
            <Label htmlFor="max_duration">Maximum Call Duration (seconds)</Label>
            <Input
              id="max_duration"
              type="number"
              value={formData.max_duration_seconds}
              onChange={(e) =>
                setFormData({ ...formData, max_duration_seconds: parseInt(e.target.value) || 600 })
              }
              min={60}
              max={3600}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Current: {Math.floor(formData.max_duration_seconds / 60)} minutes
            </p>
          </div>

          <div>
            <Label htmlFor="transfer_number">Transfer Phone Number (Optional)</Label>
            <Input
              id="transfer_number"
              type="tel"
              value={formData.transfer_phone_number || ""}
              onChange={(e) =>
                setFormData({ ...formData, transfer_phone_number: e.target.value || null })
              }
              placeholder="+1234567890"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Phone number to transfer calls to if needed (E.164 format)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="recording_enabled">Call Recording</Label>
              <p className="text-sm text-muted-foreground">
                Record all calls for quality assurance
              </p>
            </div>
            <Switch
              id="recording_enabled"
              checked={formData.recording_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, recording_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="transcription_enabled">Transcription</Label>
              <p className="text-sm text-muted-foreground">
                Generate text transcripts of calls
              </p>
            </div>
            <Switch
              id="transcription_enabled"
              checked={formData.transcription_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, transcription_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="use_knowledge_base">Use Knowledge Base</Label>
              <p className="text-sm text-muted-foreground">
                Enable the agent to use uploaded knowledge base files
              </p>
            </div>
            <Switch
              id="use_knowledge_base"
              checked={formData.use_knowledge_base}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, use_knowledge_base: checked })
              }
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSaving}
          className="btn-premium"
        >
          {isSaving ? (
            "Creating..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Voice Agent
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (confirm("Are you sure? All unsaved changes will be lost.")) {
              window.location.reload();
            }
          }}
        >
          Cancel
        </Button>
      </div>
    </motion.form>
  );
};
