import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface NavbarProps {
  agencyBranding?: {
    name: string;
    logo_url?: string;
    primary_color?: string;
  };
}

export const Navbar = ({ agencyBranding }: NavbarProps) => {
  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {agencyBranding?.logo_url ? (
            <img 
              src={agencyBranding.logo_url} 
              alt={agencyBranding.name} 
              className="h-8 w-auto"
            />
          ) : (
            <>
              <Zap 
                className="h-6 w-6" 
                style={{ color: agencyBranding?.primary_color || 'hsl(var(--primary))' }}
              />
              <span className="text-xl font-bold">
                {agencyBranding?.name || "Publisphere"}
              </span>
            </>
          )}
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/signup/agency">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
