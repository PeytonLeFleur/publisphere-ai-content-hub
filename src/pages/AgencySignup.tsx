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
    subdomain: "",
    promoCode: ""
  });
  const [isChecking, setIsChecking] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoStatus, setPromoStatus] = useState<{
    valid: boolean | null;
    message: string;
    type?: string;
  }>({ valid: null, message: "" });

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

  const validatePromoCode = async (code: string) => {
    if (!code || code.trim().length === 0) {
      setPromoStatus({ valid: null, message: "" });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('validate_promo_code', {
        promo_code_input: code
      });

      if (error) {
        console.error('Promo validation error:', error);
        setPromoStatus({ valid: false, message: "Failed to validate code" });
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setPromoStatus({
          valid: result.is_valid,
          message: result.is_valid
            ? result.discount_type === 'free'
              ? "✓ Free access - No payment required!"
              : result.discount_type === 'percentage'
              ? `✓ ${result.discount_value}% discount applied`
              : `✓ $${result.discount_value} discount applied`
            : result.message,
          type: result.discount_type
        });
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      setPromoStatus({ valid: false, message: "Invalid promo code" });
    }
  };

  const handlePromoCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData({ ...formData, promoCode: cleaned });

    if (cleaned.length >= 3) {
      const timeoutId = setTimeout(() => validatePromoCode(cleaned), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setPromoStatus({ valid: null, message: "" });
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
      // Call the agency-signup edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('agency-signup', {
        body: {
          agencyName: formData.agencyName,
          contactEmail: formData.contactEmail,
          password: formData.password,
          subdomain: formData.subdomain,
          promoCode: formData.promoCode || undefined,
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!functionData.success) {
        throw new Error(functionData.error || 'Failed to create account');
      }

      // Now sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.contactEmail,
        password: formData.password,
      });

      if (signInError) {
        throw new Error('Account created but login failed. Please try logging in.');
      }

      const paymentRequired = functionData.requiresPayment;

      toast({
        title: "Success!",
        description: paymentRequired
          ? `Account created! Please complete payment.`
          : `Welcome to Publisphere, ${formData.agencyName}! Free access granted.`,
      });

      // Redirect based on payment status
      if (paymentRequired) {
        // TODO: Redirect to payment page
        navigate('/onboarding?payment=pending');
      } else {
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
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
              <Zap className="h-8 w-8 text-foreground" />
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
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
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

            <div className="space-y-2">
              <Label htmlFor="promoCode">Promo Code (Optional)</Label>
              <Input
                id="promoCode"
                type="text"
                placeholder="Enter promo code"
                value={formData.promoCode}
                onChange={(e) => handlePromoCodeChange(e.target.value)}
                className="uppercase"
              />
              {promoStatus.message && (
                <p className={`text-sm ${
                  promoStatus.valid === true
                    ? 'text-foreground font-medium'
                    : promoStatus.valid === false
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}>
                  {promoStatus.message}
                </p>
              )}
              {promoStatus.type === 'free' && (
                <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-lg">
                  <p className="text-sm font-medium">
                    🎉 No credit card required - Get instant free access!
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !subdomainAvailable}
            >
              {isSubmitting ? "Creating Account..." : promoStatus.type === 'free' ? "Create Free Account" : "Create Agency Account"}
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
