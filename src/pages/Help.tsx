import { ClientLayout } from "@/components/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  MessageCircle, 
  Video, 
  Mail,
  FileText,
  HelpCircle
} from "lucide-react";

const Help = () => {
  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  const helpResources = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of content generation",
      icon: BookOpen,
      action: "Read Guide"
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step video tutorials",
      icon: Video,
      action: "Watch Videos"
    },
    {
      title: "Documentation",
      description: "Detailed documentation and FAQs",
      icon: FileText,
      action: "View Docs"
    },
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: Mail,
      action: "Contact Us"
    }
  ];

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
          <p className="text-muted-foreground">
            Find answers and get support when you need it
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {helpResources.map((resource) => (
            <Card key={resource.title} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <resource.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                {resource.action}
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">How do I generate my first article?</h4>
              <p className="text-sm text-muted-foreground">
                Navigate to the "Generate Content" page, enter your topic and preferences, 
                then follow the 3-step process to create your content.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Where do I add my API keys?</h4>
              <p className="text-sm text-muted-foreground">
                Go to Settings → API Keys to add your Anthropic and Unsplash API keys. 
                These are required for content generation and image search.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">How do I connect my WordPress site?</h4>
              <p className="text-sm text-muted-foreground">
                Visit Settings → WordPress Sites and follow the instructions to connect 
                your site using an application password.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
};

export default Help;
