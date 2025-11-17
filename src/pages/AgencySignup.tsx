import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { Zap, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AgencySignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    agencyName: "",
    contactEmail: "",
    password: "",
    subdomain: ""
  });
  const [isChecking, setIsChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('subdomain')
        .eq('subdomain', subdomain.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      setSubdomainAvailable(!data);
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: cleaned });
    
    if (cleaned.length >= 3) {
      const timeoutId = setTimeout(() => checkSubdomain(cleaned), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSubdomainAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subdomainAvailable) {
      toast({
        title: "Subdomain unavailable",
        description: "Please choose a different subdomain.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real implementation, this would call an edge function
      // to create the agency with proper password hashing
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      navigate('/agency/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="p-8 shadow-premium">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Create Your Agency</h1>
            </div>
            <p className="text-muted-foreground">
              Start offering white-label AI content automation to your clients
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agencyName">Agency Name</Label>
              <Input
                id="agencyName"
                type="text"
                placeholder="My Marketing Agency"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="you@agency.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Choose Your Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  type="text"
                  placeholder="myagency"
                  value={formData.subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  required
                  minLength={3}
                  className="flex-1"
                />
                {isChecking && <div className="text-muted-foreground text-sm">Checking...</div>}
                {subdomainAvailable === true && (
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                )}
                {subdomainAvailable === false && (
                  <div className="text-destructive text-sm">Taken</div>
                )}
              </div>
              {formData.subdomain && (
                <p className="text-sm text-muted-foreground">
                  Your URL: <span className="font-medium text-foreground">
                    {formData.subdomain}.publisphere.com
                  </span>
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting || !subdomainAvailable}
            >
              {isSubmitting ? "Creating Account..." : "Create Agency Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AgencySignup;
