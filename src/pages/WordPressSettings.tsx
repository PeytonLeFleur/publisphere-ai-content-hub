import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Plus, ExternalLink, RefreshCw, Trash2, Eye, EyeOff, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WordPressSite {
  id: string;
  site_name: string;
  site_url: string;
  username: string;
  is_connected: boolean;
  site_info?: any;
  last_sync?: string;
}

const WordPressSettings = () => {
  const { toast } = useToast();
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    siteName: "",
    siteUrl: "",
    username: "",
    appPassword: ""
  });

  useEffect(() => {
    loadWordPressSites();
  }, []);

  const loadWordPressSites = async () => {
    try {
      const { data, error } = await supabase
        .from('wordpress_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error loading WordPress sites:', error);
      toast({
        title: "Error",
        description: "Failed to load WordPress sites.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAndSave = async () => {
    if (!formData.siteName || !formData.siteUrl || !formData.username || !formData.appPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      // Call edge function to test and save connection
      const { data: functionData, error: functionError } = await supabase.functions.invoke('wordpress-connect', {
        body: {
          action: 'connect',
          site_name: formData.siteName,
          site_url: formData.siteUrl,
          username: formData.username,
          app_password: formData.appPassword
        }
      });

      if (functionError) throw functionError;

      if (functionData.success) {
        toast({
          title: "WordPress Connected!",
          description: `Successfully connected to ${formData.siteName}`,
        });
        setIsDialogOpen(false);
        setFormData({ siteName: "", siteUrl: "", username: "", appPassword: "" });
        loadWordPressSites();
      } else {
        toast({
          title: "Connection Failed",
          description: functionData.error || "Could not connect to WordPress site.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to WordPress.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async (siteId: string) => {
    setIsSyncing(siteId);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('wordpress-connect', {
        body: {
          action: 'sync',
          site_id: siteId
        }
      });

      if (functionError) throw functionError;

      if (functionData.success) {
        toast({
          title: "Synced!",
          description: "WordPress site metadata updated.",
        });
        loadWordPressSites();
      } else {
        toast({
          title: "Sync Failed",
          description: functionData.error || "Could not sync WordPress site.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync WordPress site.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm("Are you sure you want to remove this WordPress connection?")) return;

    try {
      const { error } = await supabase
        .from('wordpress_sites')
        .delete()
        .eq('id', siteId);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "WordPress site connection removed.",
      });
      loadWordPressSites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove WordPress site.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar agencyBranding={{ name: "Demo Agency", primary_color: "#3B82F6" }} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">WordPress Integration</h1>
            <p className="text-muted-foreground text-lg">
              Connect your WordPress sites to publish content directly
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add WordPress Site
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Connect WordPress Site</DialogTitle>
                <DialogDescription>
                  Add your WordPress site credentials to enable publishing
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    placeholder="My Blog"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">A friendly name for this site</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteUrl">WordPress Site URL</Label>
                  <Input
                    id="siteUrl"
                    type="url"
                    placeholder="https://yourblog.com"
                    value={formData.siteUrl}
                    onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Your WordPress site URL (including https://)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">WordPress Username</Label>
                  <Input
                    id="username"
                    placeholder="admin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appPassword">Application Password</Label>
                  <div className="relative">
                    <Input
                      id="appPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      value={formData.appPassword}
                      onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Card className="p-4 bg-muted/50">
                  <h4 className="font-semibold mb-2 text-sm">How to get your Application Password:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Log into your WordPress admin dashboard</li>
                    <li>Go to Users → Your Profile</li>
                    <li>Scroll down to "Application Passwords"</li>
                    <li>Enter "Publisphere" as the app name and click "Add New"</li>
                    <li>Copy the generated password and paste it here</li>
                  </ol>
                  <a
                    href="https://wordpress.org/documentation/article/application-passwords/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline mt-3"
                  >
                    Learn more about Application Passwords
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Card>

                <Button
                  onClick={handleTestAndSave}
                  disabled={isTesting}
                  className="w-full"
                  size="lg"
                >
                  {isTesting ? "Testing Connection..." : "Test & Save Connection"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading WordPress sites...</p>
          </div>
        ) : sites.length === 0 ? (
          <Card className="p-12 text-center glass-effect">
            <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No WordPress Sites Connected</h3>
            <p className="text-muted-foreground mb-6">
              Connect your first WordPress site to start publishing content
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add WordPress Site
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {sites.map((site) => (
              <Card key={site.id} className="p-6 glass-effect">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{site.site_name}</h3>
                    <a
                      href={site.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      {site.site_url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    {site.is_connected ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-secondary" />
                        <span className="text-secondary font-medium text-sm">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-destructive" />
                        <span className="text-destructive font-medium text-sm">Error</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {site.site_info && (
                    <div className="text-sm text-muted-foreground">
                      <p><span className="font-medium">Title:</span> {site.site_info.name}</p>
                      <p><span className="font-medium">Version:</span> {site.site_info.version}</p>
                    </div>
                  )}

                  {site.last_sync && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(site.last_sync).toLocaleString()}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(site.id)}
                      disabled={isSyncing === site.id}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing === site.id ? 'animate-spin' : ''}`} />
                      {isSyncing === site.id ? "Syncing..." : "Sync Now"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(site.id)}
                      className="ml-auto text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordPressSettings;
