import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Sparkles, Info } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import type { ServicePackageFormData, PackageFeature, PackageTemplate } from "@/types/packages";
import { PACKAGE_TEMPLATES, formatPrice } from "@/types/packages";

interface PackageBuilderProps {
  packageId?: string;
  onSuccess?: () => void;
}

export const PackageBuilder = ({ packageId, onSuccess }: PackageBuilderProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!packageId);
  const [availableFeatures, setAvailableFeatures] = useState<PackageFeature[]>([]);

  const [formData, setFormData] = useState<ServicePackageFormData>({
    name: "",
    description: "",
    price_cents: 29900,
    setup_fee_cents: 0,
    billing_period: "monthly",
    is_active: true,
    is_featured: false,
    badge_text: "",
    enabled_features: [],
    feature_configs: {},
    monthly_content_limit: null,
    monthly_gmb_posts_limit: null,
    monthly_articles_limit: null,
    voice_agents_limit: null,
    voice_minutes_limit: null,
    storage_limit_mb: 1000,
  });

  useEffect(() => {
    loadAvailableFeatures();
    if (packageId) {
      loadPackage();
    }
  }, [packageId]);

  const loadAvailableFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('package_features')
        .select('*')
        .order('display_order');

      if (error) throw error;

      setAvailableFeatures(data || []);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const loadPackage = async () => {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (error) throw error;

      // Extract enabled features from features object
      const enabledFeatures = Object.keys(data.features).filter(
        key => data.features[key]?.enabled
      );

      setFormData({
        name: data.name,
        description: data.description || "",
        price_cents: data.price_cents,
        setup_fee_cents: data.setup_fee_cents,
        billing_period: data.billing_period,
        is_active: data.is_active,
        is_featured: data.is_featured,
        badge_text: data.badge_text || "",
        enabled_features: enabledFeatures,
        feature_configs: data.features,
        monthly_content_limit: data.monthly_content_limit,
        monthly_gmb_posts_limit: data.monthly_gmb_posts_limit,
        monthly_articles_limit: data.monthly_articles_limit,
        voice_agents_limit: data.voice_agents_limit,
        voice_minutes_limit: data.voice_minutes_limit,
        storage_limit_mb: data.storage_limit_mb,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading package:', error);
      setIsLoading(false);
    }
  };

  const applyTemplate = (template: PackageTemplate) => {
    const enabledFeatures = Object.keys(template.features);

    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      price_cents: template.suggested_price_cents,
      enabled_features: enabledFeatures,
      feature_configs: template.features,
      ...template.limits,
    });

    toast({
      title: "Template Applied",
      description: `Applied "${template.name}" template. You can customize it further.`,
    });
  };

  const toggleFeature = (featureKey: string) => {
    const isEnabled = formData.enabled_features.includes(featureKey);

    if (isEnabled) {
      setFormData({
        ...formData,
        enabled_features: formData.enabled_features.filter(k => k !== featureKey),
      });
    } else {
      setFormData({
        ...formData,
        enabled_features: [...formData.enabled_features, featureKey],
        feature_configs: {
          ...formData.feature_configs,
          [featureKey]: { enabled: true },
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price_cents) {
      toast({
        title: "Missing required fields",
        description: "Please provide a package name and price",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-service-package', {
        body: formData,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Package "${formData.name}" created successfully`,
        });

        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="skeleton h-96 w-full" />;
  }

  const featuresByCategory = availableFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, PackageFeature[]>);

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      {/* Templates */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Start from a Template</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PACKAGE_TEMPLATES.map((template) => (
            <Button
              key={template.name}
              type="button"
              variant="outline"
              onClick={() => applyTemplate(template)}
              className="h-auto flex-col items-start p-4"
            >
              <span className="font-semibold">{template.name}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {formatPrice(template.suggested_price_cents)}/mo
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Basic Information */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Basic Information</h3>

        <div>
          <Label htmlFor="name">
            Package Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Content Starter, All-Inclusive Pro"
            className="mt-2"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what's included in this package..."
            className="mt-2"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">
              Monthly Price <span className="text-destructive">*</span>
            </Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                value={(formData.price_cents / 100).toFixed(2)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                  })
                }
                className="pl-8"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="setup_fee">Setup Fee (Optional)</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="setup_fee"
                type="number"
                value={(formData.setup_fee_cents / 100).toFixed(2)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    setup_fee_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                  })
                }
                className="pl-8"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billing_period">Billing Period</Label>
            <Select
              value={formData.billing_period}
              onValueChange={(value: any) =>
                setFormData({ ...formData, billing_period: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="is_active">Active Package</Label>
              <p className="text-sm text-muted-foreground">
                Available for clients to subscribe
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="is_featured">Featured Package</Label>
              <p className="text-sm text-muted-foreground">
                Highlight as recommended
              </p>
            </div>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_featured: checked })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="badge_text">Badge Text (Optional)</Label>
          <Input
            id="badge_text"
            value={formData.badge_text}
            onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
            placeholder="e.g., Most Popular, Best Value"
            className="mt-2"
          />
        </div>
      </Card>

      {/* Features */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Features Included</h3>

        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium capitalize text-sm text-muted-foreground">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Label className="font-medium">{feature.feature_name}</Label>
                    {feature.feature_description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {feature.feature_description}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={formData.enabled_features.includes(feature.feature_key)}
                    onCheckedChange={() => toggleFeature(feature.feature_key)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* Usage Limits */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Usage Limits</h3>
            <p className="text-sm text-muted-foreground">
              Leave blank for unlimited. Set limits to control usage per month.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="content_limit">Monthly Content Limit</Label>
            <Input
              id="content_limit"
              type="number"
              value={formData.monthly_content_limit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_content_limit: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
              className="mt-2"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="gmb_limit">Monthly GMB Posts Limit</Label>
            <Input
              id="gmb_limit"
              type="number"
              value={formData.monthly_gmb_posts_limit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_gmb_posts_limit: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
              className="mt-2"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="articles_limit">Monthly Articles Limit</Label>
            <Input
              id="articles_limit"
              type="number"
              value={formData.monthly_articles_limit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_articles_limit: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
              className="mt-2"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="voice_agents_limit">Max Voice Agents</Label>
            <Input
              id="voice_agents_limit"
              type="number"
              value={formData.voice_agents_limit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  voice_agents_limit: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
              className="mt-2"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="voice_minutes_limit">Voice Minutes/Month</Label>
            <Input
              id="voice_minutes_limit"
              type="number"
              value={formData.voice_minutes_limit || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  voice_minutes_limit: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
              className="mt-2"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="storage_limit">Storage Limit (MB)</Label>
            <Input
              id="storage_limit"
              type="number"
              value={formData.storage_limit_mb || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  storage_limit_mb: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="Unlimited"
              className="mt-2"
              min="0"
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSaving}
          className="btn-premium"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {packageId ? "Update Package" : "Create Package"}
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </motion.form>
  );
};
