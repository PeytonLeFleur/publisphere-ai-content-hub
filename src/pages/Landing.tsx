import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Check, Zap, Users, Globe, Lock, Sparkles, BarChart3 } from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Users,
      title: "Multi-Tenant Architecture",
      description: "Manage multiple clients under your agency brand with complete white-labeling."
    },
    {
      icon: Lock,
      title: "BYOK Security",
      description: "Clients bring their own API keys. Your data, your control, complete security."
    },
    {
      icon: Globe,
      title: "Custom Domains",
      description: "Use your agency subdomain or connect custom domains for each client."
    },
    {
      icon: Sparkles,
      title: "AI-Powered Content",
      description: "Generate articles, GMB posts, and social content using Claude and GPT."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track content performance, engagement, and ROI for all your clients."
    },
    {
      icon: Zap,
      title: "One-Click Publishing",
      description: "Schedule and publish content across multiple platforms automatically."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Lifetime Deal - Limited Time Offer
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              White Label Content
              <br />
              <span className="gradient-hero bg-clip-text text-transparent">
                Automation for Agencies
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Launch your own AI content automation platform. Complete white-labeling, 
              multi-tenant architecture, and BYOK security. Perfect for agencies managing multiple clients.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup/agency">
                <Button size="lg" className="text-lg px-8 shadow-premium">
                  Get Lifetime Access - $147
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Scale</h2>
            <p className="text-xl text-muted-foreground">
              Built for agencies who want to offer AI content services under their own brand
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-effect p-6 rounded-lg shadow-card hover:shadow-premium transition-all duration-300">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-effect p-12 rounded-2xl shadow-premium text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-sm font-medium text-secondary mb-6">
                <Zap className="h-4 w-4" />
                Limited Time Offer
              </div>
              <h2 className="text-4xl font-bold mb-4">Lifetime Deal</h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-6xl font-bold">$147</span>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground line-through">$497/year</div>
                  <div className="text-sm font-medium text-secondary">One-time payment</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-8 text-left max-w-md mx-auto">
              {[
                "Unlimited agencies",
                "Unlimited clients per agency",
                "Complete white-labeling",
                "Custom domain support",
                "BYOK security model",
                "Priority email support",
                "All future updates included"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-1 bg-primary/10 rounded-full">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <Link to="/signup/agency">
              <Button size="lg" className="text-lg px-12 shadow-premium">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Publisphere</span>
              </div>
              <p className="text-sm text-muted-foreground">
                White label content automation for agencies.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 Publisphere. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
