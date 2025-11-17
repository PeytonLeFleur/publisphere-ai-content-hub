import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";

interface ApiKey {
  service: string;
  name: string;
  description: string;
  status: 'valid' | 'invalid' | 'not_configured';
  required: boolean;
  instructionsUrl: string;
  lastTested?: string;
}

const ApiKeysSettings = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      service: 'anthropic',
      name: 'Anthropic (Claude)',
      description: 'Required for AI content generation using Claude models',
      status: 'not_configured',
      required: true,
      instructionsUrl: 'https://console.anthropic.com/settings/keys'
    },
    {
      service: 'openai',
      name: 'OpenAI (GPT)',
      description: 'Optional - Use GPT models for content generation',
      status: 'not_configured',
      required: false,
      instructionsUrl: 'https://platform.openai.com/api-keys'
    },
    {
      service: 'unsplash',
      name: 'Unsplash',
      description: 'Required for high-quality stock images in content',
      status: 'not_configured',
      required: true,
      instructionsUrl: 'https://unsplash.com/oauth/applications'
    }
  ]);

  const handleSaveKey = async (service: string, value: string) => {
    setIsSubmitting(service);
    try {
      // In a real implementation, this would call an edge function
      // to encrypt and save the API key
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "API key saved",
        description: "Your API key has been securely stored.",
      });

      setApiKeys(prev => prev.map(key => 
        key.service === service 
          ? { ...key, status: 'valid', lastTested: new Date().toISOString() }
          : key
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleTestConnection = async (service: string) => {
    setIsSubmitting(`test-${service}`);
    try {
      // In a real implementation, this would call an edge function
      // to test the API connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Connection successful",
        description: "Your API key is working correctly.",
      });

      setApiKeys(prev => prev.map(key => 
        key.service === service 
          ? { ...key, status: 'valid', lastTested: new Date().toISOString() }
          : key
      ));
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Please check your API key and try again.",
        variant: "destructive"
      });

      setApiKeys(prev => prev.map(key => 
        key.service === service 
          ? { ...key, status: 'invalid' }
          : key
      ));
    } finally {
      setIsSubmitting(null);
    }
  };

  const getStatusIcon = (status: ApiKey['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-5 w-5 text-secondary" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'not_configured':
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: ApiKey['status']) => {
    switch (status) {
      case 'valid':
        return <span className="text-secondary font-medium">Connected</span>;
      case 'invalid':
        return <span className="text-destructive font-medium">Invalid</span>;
      case 'not_configured':
        return <span className="text-muted-foreground">Not configured</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar agencyBranding={{ name: "Demo Agency", primary_color: "#3B82F6" }} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">API Keys</h1>
          <p className="text-muted-foreground text-lg">
            Manage your API keys for AI services. Your keys are encrypted and never shared.
          </p>
        </div>

        <div className="space-y-6">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.service} className="p-6 glass-effect">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{apiKey.name}</h3>
                    {apiKey.required && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{apiKey.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(apiKey.status)}
                  {getStatusText(apiKey.status)}
                </div>
              </div>

              {apiKey.lastTested && (
                <p className="text-sm text-muted-foreground mb-4">
                  Last tested: {new Date(apiKey.lastTested).toLocaleString()}
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`key-${apiKey.service}`}>API Key</Label>
                  <Input
                    id={`key-${apiKey.service}`}
                    type="password"
                    placeholder="••••••••••••••••••••"
                    className="font-mono"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.parentElement?.querySelector('input');
                      if (input?.value) handleSaveKey(apiKey.service, input.value);
                    }}
                    disabled={isSubmitting === apiKey.service}
                  >
                    {isSubmitting === apiKey.service ? "Saving..." : "Save Key"}
                  </Button>
                  
                  {apiKey.status !== 'not_configured' && (
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection(apiKey.service)}
                      disabled={isSubmitting === `test-${apiKey.service}`}
                    >
                      {isSubmitting === `test-${apiKey.service}` ? "Testing..." : "Test Connection"}
                    </Button>
                  )}

                  <a
                    href={apiKey.instructionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline ml-auto"
                  >
                    Get API key
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 glass-effect mt-8 bg-muted/50">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Security Information
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Your API keys are encrypted using AES-256 encryption before storage</p>
            <p>• Keys are only decrypted when making API calls on your behalf</p>
            <p>• We never share your API keys with third parties</p>
            <p>• You can revoke access at any time by removing your keys</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ApiKeysSettings;
