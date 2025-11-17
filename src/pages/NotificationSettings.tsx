import { useState } from "react";
import { ClientLayout } from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

const NotificationSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    publish_success: true,
    publish_failure: true,
    content_ready: true,
    weekly_summary: true,
    automation_alerts: true,
    api_warnings: true,
    email_frequency: "realtime",
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    weekly_summary_day: "monday"
  });

  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  const handleSave = () => {
    toast({
      title: "Success",
      description: "Notification settings saved successfully",
    });
  };

  const notificationTypes = [
    {
      id: "publish_success",
      label: "Publish Success",
      description: "Get notified when content is published successfully",
      icon: CheckCircle,
      color: "text-secondary"
    },
    {
      id: "publish_failure",
      label: "Publish Failures",
      description: "Get alerted when content fails to publish",
      icon: XCircle,
      color: "text-destructive"
    },
    {
      id: "content_ready",
      label: "Content Ready for Review",
      description: "Notification 24 hours before scheduled publish time",
      icon: Calendar,
      color: "text-primary"
    },
    {
      id: "weekly_summary",
      label: "Weekly Summary",
      description: "Weekly report of content created and published",
      icon: TrendingUp,
      color: "text-accent"
    },
    {
      id: "automation_alerts",
      label: "Automation Alerts",
      description: "Get notified when automation rules complete or fail",
      icon: Bell,
      color: "text-primary"
    },
    {
      id: "api_warnings",
      label: "API Usage Warnings",
      description: "Alerts for API key issues or usage limits",
      icon: AlertTriangle,
      color: "text-amber-500"
    }
  ];

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how and when you receive notifications
          </p>
        </div>

        {/* Notification Types */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </h2>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-start justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-start gap-3 flex-1">
                  <type.icon className={`h-5 w-5 mt-0.5 ${type.color}`} />
                  <div>
                    <Label className="font-medium">{type.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings[type.id as keyof typeof settings] as boolean}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, [type.id]: checked })
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Email Preferences */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <Label>Email Frequency</Label>
              <Select
                value={settings.email_frequency}
                onValueChange={(value) =>
                  setSettings({ ...settings, email_frequency: value })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How often you want to receive email notifications
              </p>
            </div>

            {settings.weekly_summary && (
              <div>
                <Label>Weekly Summary Day</Label>
                <Select
                  value={settings.weekly_summary_day}
                  onValueChange={(value) =>
                    setSettings({ ...settings, weekly_summary_day: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Quiet Hours</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Start</Label>
                  <Input
                    type="time"
                    value={settings.quiet_hours_start}
                    onChange={(e) =>
                      setSettings({ ...settings, quiet_hours_start: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">End</Label>
                  <Input
                    type="time"
                    value={settings.quiet_hours_end}
                    onChange={(e) =>
                      setSettings({ ...settings, quiet_hours_end: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pause notifications during these hours
              </p>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </ClientLayout>
  );
};

export default NotificationSettings;
