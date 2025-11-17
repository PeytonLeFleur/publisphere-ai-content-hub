import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Check, Zap, Users, Globe, Lock, Sparkles, BarChart3, ArrowRight } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem, fadeInScale } from "@/lib/animations";

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
      <section className="relative overflow-hidden py-24 md:py-32 px-4">
        <div className="absolute inset-0 gradient-bg-animate opacity-50"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-medium animate-fade-in"
            >
              <Sparkles className="h-4 w-4 animate-pulse-subtle" />
              Lifetime Deal - Limited Time Offer
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight text-balance"
            >
              White Label Content
              <br />
              <span className="gradient-text">
                Automation for Agencies
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Launch your own AI content automation platform. Complete white-labeling,
              multi-tenant architecture, and BYOK security. Perfect for agencies managing multiple clients.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/signup/agency">
                <Button size="lg" className="btn-premium text-lg px-10 py-6 gap-2 group">
                  Get Lifetime Access - $147
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-10 py-6 hover-glow interactive"
                >
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-background" />
                  ))}
                </div>
                <span>100+ agencies already using Publisphere</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for agencies who want to offer AI content services under their own brand
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={staggerItem}
                  custom={index}
                  className="card-premium p-8 group cursor-default"
                >
                  <div className="p-3 bg-foreground/5 border border-foreground/10 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            {[
              { value: "100+", label: "Agencies Onboarded" },
              { value: "10K+", label: "Content Pieces Generated" },
              { value: "99.9%", label: "Uptime Guarantee" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="metric-card p-8"
              >
                <div className="text-5xl md:text-6xl font-bold mb-2 gradient-text">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInScale}
            className="glass-card p-12 md:p-16 text-center"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-medium mb-6 animate-pulse-subtle"
              >
                <Zap className="h-4 w-4" />
                Limited Time Offer - 70% Off
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Lifetime Deal</h2>
              <div className="flex items-center justify-center gap-3 mb-8">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                  className="text-7xl md:text-8xl font-bold"
                >
                  $147
                </motion.span>
                <div className="text-left">
                  <div className="text-sm text-muted-foreground line-through">$497/year</div>
                  <div className="text-sm font-medium">One-time payment</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-10 text-left max-w-md mx-auto">
              {[
                "Unlimited agencies",
                "Unlimited clients per agency",
                "Complete white-labeling",
                "Custom domain support",
                "BYOK security model",
                "Priority email support",
                "All future updates included"
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 text-base"
                >
                  <div className="p-1.5 bg-foreground/10 rounded-full shrink-0">
                    <Check className="h-4 w-4 text-foreground" />
                  </div>
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/signup/agency">
                <Button size="lg" className="btn-premium text-lg px-12 py-6 gap-2 group">
                  Get Started Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                30-day money-back guarantee • No credit card required to try
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-foreground" />
                <span className="text-xl font-bold">Publisphere</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 Publisphere. All rights reserved. Built with ❤️ for agencies.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
