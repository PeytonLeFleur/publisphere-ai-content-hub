import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Sparkles, 
  FolderOpen, 
  Calendar as CalendarIcon,
  Globe,
  MessageSquare,
  Settings,
  HelpCircle,
  RefreshCw,
  Clock
} from "lucide-react";

interface ClientLayoutProps {
  children: ReactNode;
  agencyBranding?: {
    name: string;
    logo_url?: string;
    primary_color?: string;
  };
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Generate Content", href: "/generate", icon: Sparkles },
  { name: "Content Library", href: "/content", icon: FolderOpen },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Automation", href: "/automation", icon: RefreshCw },
  { name: "Job Logs", href: "/jobs", icon: Clock },
  { name: "WordPress Sites", href: "/settings/wordpress", icon: Globe },
  { name: "GMB Posts", href: "/gmb-posts", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export const ClientLayout = ({ children, agencyBranding }: ClientLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              {agencyBranding?.logo_url ? (
                <img 
                  src={agencyBranding.logo_url} 
                  alt={agencyBranding.name} 
                  className="h-8 w-auto"
                />
              ) : (
                <>
                  <Sparkles className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold text-sidebar-foreground">
                    {agencyBranding?.name || "Publisphere"}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || 
                               location.pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <div className="text-xs text-muted-foreground">
              Powered by {agencyBranding?.name || "Publisphere"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
