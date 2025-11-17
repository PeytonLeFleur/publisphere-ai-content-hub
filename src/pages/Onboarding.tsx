import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Upload, Palette, UserPlus, Sparkles } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [branding, setBranding] = useState({
    logo: null as File | null,
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981"
  });
  const [firstClient, setFirstClient] = useState({
    businessName: "",
    email: ""
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBranding({ ...branding, logo: e.target.files[0] });
    }
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      toast({
        title: "Setup Complete!",
        description: "Welcome to Publisphere. Let's generate some content!"
      });
      navigate('/agency/dashboard');
    }
  };

  const handleSkipClient = () => {
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8 shadow-premium">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > i ? <Check className="h-5 w-5" /> : i}
              </div>
              {i < 4 && (
                <div className={`h-1 w-12 mx-2 ${step > i ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4">Welcome to Publisphere!</h1>
              <p className="text-xl text-muted-foreground">
                Let's get your white label dashboard set up in 3 minutes
              </p>
            </div>
            <Button size="lg" onClick={handleNextStep} className="px-12">
              Start Setup
            </Button>
          </div>
        )}

        {/* Step 2: Agency Branding */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Agency Branding</h2>
              <p className="text-muted-foreground">
                This is what your clients will see
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">Agency Logo</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label htmlFor="logo" className="cursor-pointer">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {branding.logo ? branding.logo.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 200x50px, PNG with transparency
                    </p>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary">Primary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      id="primary"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary">Secondary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      id="secondary"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">Preview</p>
                <div className="bg-background p-4 rounded border">
                  <div className="h-8 flex items-center gap-2">
                    <div style={{ backgroundColor: branding.primaryColor }} className="w-8 h-8 rounded" />
                    <span className="font-bold">Your Agency Name</span>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleNextStep} className="w-full" size="lg">
              Next
            </Button>
          </div>
        )}

        {/* Step 3: Create First Client */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Add Your First Client</h2>
              <p className="text-muted-foreground">
                Let's get you set up with your first client
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="ACME Heating & Cooling"
                  value={firstClient.businessName}
                  onChange={(e) => setFirstClient({ ...firstClient, businessName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@acmehvac.com"
                  value={firstClient.email}
                  onChange={(e) => setFirstClient({ ...firstClient, email: e.target.value })}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium mb-1">What happens next?</p>
                <p className="text-muted-foreground">
                  We'll create an account and send them a welcome email with login credentials.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSkipClient} variant="outline" className="flex-1">
                I'll set up clients later
              </Button>
              <Button onClick={handleNextStep} className="flex-1">
                Create Client
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Quick Start Guide */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
              <p className="text-muted-foreground">
                Here's what to do next
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">✓ Branding set up</p>
                  <p className="text-sm text-muted-foreground">Your white label dashboard is ready</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="w-5 h-5 border-2 border-muted rounded mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">☐ Add API keys</p>
                  <p className="text-sm text-muted-foreground">Required for content generation</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="w-5 h-5 border-2 border-muted rounded mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">☐ Connect WordPress site</p>
                  <p className="text-sm text-muted-foreground">Enable auto-publishing</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="w-5 h-5 border-2 border-muted rounded mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">☐ Generate first article</p>
                  <p className="text-sm text-muted-foreground">See the AI in action</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="w-5 h-5 border-2 border-muted rounded mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">☐ Schedule content</p>
                  <p className="text-sm text-muted-foreground">Automate your content calendar</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="w-5 h-5 border-2 border-muted rounded mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">☐ Invite more clients</p>
                  <p className="text-sm text-muted-foreground">Scale your content services</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleNextStep} className="w-full">
                Go to Dashboard
              </Button>
              <Button variant="outline" size="lg" className="w-full">
                Watch Tutorial Videos
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Onboarding;
