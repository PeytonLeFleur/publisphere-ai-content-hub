import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2 } from "lucide-react";
import { fadeInUp } from "@/lib/animations";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call super admin login edge function
      const { data, error } = await supabase.functions.invoke(
        "super-admin-login",
        {
          body: {
            email: formData.email,
            password: formData.password,
          },
        }
      );

      if (error) throw error;

      if (data.success && data.session) {
        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) throw sessionError;

        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.admin.full_name || "Super Admin"}`,
        });

        navigate("/super-admin");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error: any) {
      console.error("Super admin login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="w-full max-w-md"
      >
        <Card className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-foreground/5 border border-foreground/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Super Admin</h1>
            <p className="text-muted-foreground text-center">
              Secure access to PubliSphere administration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-premium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              This area is restricted to authorized super administrators only.
            </p>
          </div>
        </Card>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-sm"
          >
            ← Back to home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
