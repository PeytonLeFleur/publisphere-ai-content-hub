import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, ExternalLink, Key, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

export const VoiceAgentSetup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Twilio credentials
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [hasTwilioCredentials, setHasTwilioCredentials] = useState(false);
  const [twilioVerified, setTwilioVerified] = useState(false);

  // ElevenLabs credentials
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [hasElevenLabsCredentials, setHasElevenLabsCredentials] = useState(false);
  const [elevenLabsVerified, setElevenLabsVerified] = useState(false);

  useEffect(() => {
    loadCredentialsStatus();
  }, []);

  const loadCredentialsStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', user.email)
        .single();

      if (!agency) return;

      // Check Twilio credentials
      const { data: twilioData } = await supabase
        .from('twilio_credentials')
        .select('is_verified, last_verified_at')
        .eq('agency_id', agency.id)
        .single();

      if (twilioData) {
        setHasTwilioCredentials(true);
        setTwilioVerified(twilioData.is_verified);
      }

      // Check ElevenLabs credentials
      const { data: elevenLabsData } = await supabase
        .from('elevenlabs_credentials')
        .select('is_verified, last_verified_at')
        .eq('agency_id', agency.id)
        .single();

      if (elevenLabsData) {
        setHasElevenLabsCredentials(true);
        setElevenLabsVerified(elevenLabsData.is_verified);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading credentials status:', error);
      setIsLoading(false);
    }
  };

  const handleSaveTwilioCredentials = async () => {
    if (!twilioAccountSid || !twilioAuthToken) {
      toast({
        title: "Missing credentials",
        description: "Please enter both Account SID and Auth Token",
        variant: "destructive",
      });
      return;
    }

    if (!twilioAccountSid.startsWith('AC') || twilioAccountSid.length !== 34) {
      toast({
        title: "Invalid Account SID",
        description: "Account SID should start with 'AC' and be 34 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('save-twilio-credentials', {
        body: {
          account_sid: twilioAccountSid,
          auth_token: twilioAuthToken,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Twilio credentials saved and verified",
        });
        setHasTwilioCredentials(true);
        setTwilioVerified(true);
        setTwilioAccountSid("");
        setTwilioAuthToken("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Twilio credentials",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveElevenLabsKey = async () => {
    if (!elevenLabsApiKey) {
      toast({
        title: "Missing API key",
        description: "Please enter your ElevenLabs API key",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('save-elevenlabs-key', {
        body: {
          api_key: elevenLabsApiKey,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `ElevenLabs API key verified. Plan: ${data.user_info?.subscription || 'Unknown'}`,
        });
        setHasElevenLabsCredentials(true);
        setElevenLabsVerified(true);
        setElevenLabsApiKey("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save ElevenLabs API key",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-64 w-full" />
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
      {/* Twilio Configuration */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-semibold">Twilio Configuration</h3>
              {hasTwilioCredentials && twilioVerified ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Configured
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Not Configured
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              Configure your Twilio credentials to enable phone number provisioning and call routing.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="twilioAccountSid">
              Account SID {!hasTwilioCredentials && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="twilioAccountSid"
              type="password"
              value={twilioAccountSid}
              onChange={(e) => setTwilioAccountSid(e.target.value)}
              placeholder={hasTwilioCredentials ? "••••••••••••••••••••••••••••••" : "AC..."}
              className="font-mono mt-2"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Starts with "AC" - 34 characters
            </p>
          </div>

          <div>
            <Label htmlFor="twilioAuthToken">
              Auth Token {!hasTwilioCredentials && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="twilioAuthToken"
              type="password"
              value={twilioAuthToken}
              onChange={(e) => setTwilioAuthToken(e.target.value)}
              placeholder={hasTwilioCredentials ? "••••••••••••••••••••••••••••••" : "Your Auth Token"}
              className="font-mono mt-2"
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveTwilioCredentials}
              disabled={isSaving || (!twilioAccountSid && !twilioAuthToken)}
              className="btn-premium"
            >
              {isSaving ? "Verifying..." : hasTwilioCredentials ? "Update Credentials" : "Save & Verify"}
            </Button>

            <a
              href="https://console.twilio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Get credentials from Twilio
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Card>

      {/* ElevenLabs Configuration */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Key className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-semibold">ElevenLabs Configuration</h3>
              {hasElevenLabsCredentials && elevenLabsVerified ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Configured
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Not Configured
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              Configure your ElevenLabs API key to enable AI voice generation for your voice agents.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="elevenLabsApiKey">
              ElevenLabs API Key {!hasElevenLabsCredentials && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="elevenLabsApiKey"
              type="password"
              value={elevenLabsApiKey}
              onChange={(e) => setElevenLabsApiKey(e.target.value)}
              placeholder={hasElevenLabsCredentials ? "••••••••••••••••••••" : "Your API Key"}
              className="font-mono mt-2"
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveElevenLabsKey}
              disabled={isSaving || !elevenLabsApiKey}
              className="btn-premium"
            >
              {isSaving ? "Verifying..." : hasElevenLabsCredentials ? "Update API Key" : "Save & Verify"}
            </Button>

            <a
              href="https://elevenlabs.io/app/settings/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Get API key from ElevenLabs
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Card>

      {/* Setup Status */}
      {hasTwilioCredentials && hasElevenLabsCredentials && twilioVerified && elevenLabsVerified && (
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Voice Agent Setup Complete!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You're all set to create voice agents. Start by provisioning a phone number or uploading knowledge base files.
              </p>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
};
