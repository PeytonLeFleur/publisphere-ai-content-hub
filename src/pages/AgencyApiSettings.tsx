import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, Key, ArrowLeft } from "lucide-react";
import { fadeInUp } from "@/lib/animations";
import { motion } from "framer-motion";

const AgencyApiSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApiKeyStatus();
  }, []);

  const loadApiKeyStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: agency } = await supabase
        .from('agencies')
        .select('claude_api_key_encrypted')
        .eq('contact_email', user.email)
        .single();

      if (agency?.claude_api_key_encrypted) {
        setHasKey(true);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading API key status:', error);
      setIsLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid Anthropic API key (starts with 'sk-ant-')",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call edge function to encrypt and save the API key
      const { error } = await supabase.functions.invoke('save-agency-api-key', {
        body: { apiKey },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your Claude API key has been securely saved",
      });

      setHasKey(true);
      setApiKey(""); // Clear the input

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveKey = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('agencies')
        .update({ claude_api_key_encrypted: null })
        .eq('contact_email', user.email);

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key has been removed",
      });

      setHasKey(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove API key",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="skeleton h-12 w-64" />
          <div className="skeleton h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/agency/billing')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Billing
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Key className="h-10 w-10" />
              API Configuration
            </h1>
            <p className="text-muted-foreground text-lg">
              Configure your Claude API key for all client content generation
            </p>
          </div>

          <Card className="p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold">Anthropic Claude API</h3>
                  {hasKey ? (
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
                  This API key will be used for all content generation across your clients.
                  Your key is encrypted and stored securely.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="apiKey">
                  Claude API Key {!hasKey && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasKey ? "••••••••••••••••••••" : "sk-ant-..."}
                  className="font-mono mt-2"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Your API key should start with "sk-ant-"
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveKey}
                  disabled={isSubmitting || !apiKey}
                  className="btn-premium"
                >
                  {isSubmitting ? "Saving..." : hasKey ? "Update Key" : "Save Key"}
                </Button>

                {hasKey && (
                  <Button
                    variant="destructive"
                    onClick={handleRemoveKey}
                    disabled={isSubmitting}
                  >
                    Remove Key
                  </Button>
                )}

                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline ml-auto"
                >
                  Get API key from Anthropic
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-5 w-5" />
              Important Information
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• <strong>Agency-Level API Key:</strong> This key is used for ALL your clients' content generation</p>
              <p>• <strong>Cost Control:</strong> You are responsible for API usage costs. Set appropriate subscription pricing to cover costs and profit</p>
              <p>• <strong>Security:</strong> Your API key is encrypted using AES-256-GCM before storage</p>
              <p>• <strong>Required:</strong> Content generation will not work without a valid API key configured</p>
              <p>• <strong>Billing Model:</strong> Clients pay you via Stripe subscriptions. You pay Anthropic for API usage</p>
            </div>
          </Card>

          <Card className="p-6 bg-muted/50 mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              How It Works
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. You configure your Anthropic Claude API key here (one time)</p>
              <p>2. Create subscription plans in your billing dashboard with your own pricing</p>
              <p>3. Subscribe clients to plans - they pay you via Stripe</p>
              <p>4. Clients generate content using YOUR API key (not theirs)</p>
              <p>5. You profit from the difference between your subscription price and API costs</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AgencyApiSettings;
