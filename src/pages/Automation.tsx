import { useState, useEffect } from "react";
import { ClientLayout } from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Plus, 
  Clock, 
  Play, 
  Pause, 
  Trash, 
  Edit,
  Zap,
  RefreshCw,
  Calendar
} from "lucide-react";

const Automation = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: "",
    rule_type: "recurring_content",
    frequency: "weekly",
    frequency_config: {
      days: [] as string[],
      time: "09:00"
    },
    content_config: {
      content_type: "blog_article",
      topic: "",
      rotating_topics: [] as string[],
      tone: "professional",
      word_count: 2000,
      auto_publish: false
    }
  });

  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRules(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Rule ${!isActive ? "activated" : "paused"}`,
      });

      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });

      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateRule = async () => {
    try {
      // Get current user's client_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create rules",
          variant: "destructive",
        });
        return;
      }

      // Get client record
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!clientData) {
        toast({
          title: "Error",
          description: "Client profile not found",
          variant: "destructive",
        });
        return;
      }

      // Calculate next run time
      const nextRun = new Date();
      if (formData.frequency === "daily") {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (formData.frequency === "weekly") {
        nextRun.setDate(nextRun.getDate() + 7);
      }

      const { error } = await supabase
        .from("automation_rules")
        .insert([{
          client_id: clientData.id,
          rule_name: formData.rule_name,
          rule_type: formData.rule_type,
          frequency: formData.frequency,
          frequency_config: formData.frequency_config,
          content_config: formData.content_config,
          next_run: nextRun.toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation rule created successfully",
      });

      setShowCreateDialog(false);
      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const labels = {
      recurring_content: "Recurring Generation",
      auto_publish: "Auto-Publish",
      bulk_generation: "Bulk Generation"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getRuleTypeColor = (type: string) => {
    const colors = {
      recurring_content: "bg-primary text-primary-foreground",
      auto_publish: "bg-secondary text-secondary-foreground",
      bulk_generation: "bg-accent text-accent-foreground"
    };
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const getFrequencyLabel = (frequency: string, config: any) => {
    if (frequency === "daily") {
      return `Daily at ${config?.time || "09:00"}`;
    } else if (frequency === "weekly") {
      const days = config?.days || [];
      return `Weekly on ${days.join(", ")} at ${config?.time || "09:00"}`;
    } else if (frequency === "monthly") {
      return `Monthly on day ${config?.day || "1"} at ${config?.time || "09:00"}`;
    }
    return frequency;
  };

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Automation</h1>
            <p className="text-muted-foreground">
              Set up rules to automatically generate and publish content
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
                <DialogDescription>
                  Set up a new automation rule for recurring content generation
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    placeholder="e.g., Weekly Blog Posts"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Rule Type</Label>
                  <Select
                    value={formData.rule_type}
                    onValueChange={(value) => setFormData({ ...formData, rule_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recurring_content">Recurring Content Generation</SelectItem>
                      <SelectItem value="auto_publish">Auto-Publish</SelectItem>
                      <SelectItem value="bulk_generation">Bulk Generation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Content Type</Label>
                  <Select
                    value={formData.content_config.content_type}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        content_config: { ...formData.content_config, content_type: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog_article">Blog Article</SelectItem>
                      <SelectItem value="gmb_post">GMB Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Topic or Keyword</Label>
                  <Input
                    placeholder="e.g., HVAC maintenance tips"
                    value={formData.content_config.topic}
                    onChange={(e) => 
                      setFormData({ 
                        ...formData, 
                        content_config: { ...formData.content_config, topic: e.target.value }
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.frequency === "weekly" && (
                  <div>
                    <Label>Days of Week</Label>
                    <div className="flex gap-2 mt-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={formData.frequency_config.days.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const days = formData.frequency_config.days.includes(day)
                              ? formData.frequency_config.days.filter(d => d !== day)
                              : [...formData.frequency_config.days, day];
                            setFormData({
                              ...formData,
                              frequency_config: { ...formData.frequency_config, days }
                            });
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.frequency_config.time}
                    onChange={(e) => 
                      setFormData({ 
                        ...formData, 
                        frequency_config: { ...formData.frequency_config, time: e.target.value }
                      })
                    }
                  />
                </div>

                <Button onClick={handleCreateRule} className="w-full">
                  Create Automation Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rules List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">Loading automation rules...</div>
          </div>
        ) : rules.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first automation rule to start generating content automatically
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rules.map((rule) => (
              <Card key={rule.id} className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{rule.rule_name}</h3>
                    <Badge className={getRuleTypeColor(rule.rule_type)}>
                      {getRuleTypeLabel(rule.rule_type)}
                    </Badge>
                  </div>
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                  />
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getFrequencyLabel(rule.frequency, rule.frequency_config)}</span>
                  </div>

                  {rule.last_run && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4" />
                      <span>Last run: {format(new Date(rule.last_run), "MMM d, h:mm a")}</span>
                    </div>
                  )}

                  {rule.next_run && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Next run: {format(new Date(rule.next_run), "MMM d, h:mm a")}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleRule(rule.id, rule.is_active)}
                  >
                    {rule.is_active ? (
                      <>
                        <Pause className="mr-1 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-4 w-4" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default Automation;
