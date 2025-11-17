import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAgencyBranding } from "@/contexts/AgencyBrandingContext";

const ClientLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { branding, loading: brandingLoading } = useAgencyBranding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agencyBranding = branding || {
    name: "Publisphere",
    primary_color: "#3B82F6",
    logo_url: null,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if this user is a client or agency
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, business_name, agency_id, is_active')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (client) {
        // This is a client
        if (!client.is_active) {
          await supabase.auth.signOut();
          throw new Error('Your account has been deactivated. Please contact your agency.');
        }

        toast({
          title: "Welcome back!",
          description: `Logged in as ${client.business_name}`,
        });
        navigate('/dashboard');
      } else {
        // Check if this is an agency
        const { data: agency } = await supabase
          .from('agencies')
          .select('id, name')
          .eq('contact_email', email.toLowerCase())
          .maybeSingle();

        if (agency) {
          toast({
            title: "Welcome back!",
            description: `Logged in as ${agency.name}`,
          });
          navigate('/agency/dashboard');
        } else {
          await supabase.auth.signOut();
          throw new Error('Account not found. Please contact support.');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message || "Invalid email or password.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar agencyBranding={agencyBranding} />

      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="p-8 shadow-premium">
          <div className="text-center mb-8">
            {agencyBranding.logo_url && (
              <img
                src={agencyBranding.logo_url}
                alt={agencyBranding.name}
                className="h-16 mx-auto mb-4 object-contain"
              />
            )}
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to {agencyBranding.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ClientLogin;
