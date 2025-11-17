import { ClientLayout } from "@/components/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Key, Globe, User, Bell } from "lucide-react";

const Settings = () => {
  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  const settingsSections = [
    {
      title: "API Keys",
      description: "Manage your Anthropic and Unsplash API keys",
      icon: Key,
      href: "/settings/api-keys",
      color: "text-primary"
    },
    {
      title: "WordPress Sites",
      description: "Connect and manage WordPress sites",
      icon: Globe,
      href: "/settings/wordpress",
      color: "text-secondary"
    },
    {
      title: "Profile",
      description: "Update your business information",
      icon: User,
      href: "/settings/profile",
      color: "text-accent"
    },
    {
      title: "Notifications",
      description: "Configure email and notification preferences",
      icon: Bell,
      href: "/settings/notifications",
      color: "text-muted-foreground"
    }
  ];

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsSections.map((section) => (
            <Link key={section.href} to={section.href}>
              <Card className="p-6 hover:shadow-card transition-all cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
};

export default Settings;
