import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  Users,
  FileText,
  Calendar,
  Settings,
  Sparkles,
  TrendingUp,
  LogOut,
  Plus,
  Eye,
  Edit,
  Zap
} from "lucide-react";

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Toggle command palette with CMD+K or CTRL+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close on escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const commands = [
    {
      heading: "Navigation",
      items: [
        {
          icon: Home,
          label: "Dashboard",
          shortcut: "D",
          onSelect: () => runCommand(() => navigate("/dashboard")),
        },
        {
          icon: Users,
          label: "Clients",
          shortcut: "C",
          onSelect: () => runCommand(() => navigate("/clients")),
        },
        {
          icon: Sparkles,
          label: "Generate Content",
          shortcut: "G",
          onSelect: () => runCommand(() => navigate("/generate")),
        },
        {
          icon: Calendar,
          label: "Schedule",
          shortcut: "S",
          onSelect: () => runCommand(() => navigate("/schedule")),
        },
        {
          icon: TrendingUp,
          label: "Analytics",
          shortcut: "A",
          onSelect: () => runCommand(() => navigate("/analytics")),
        },
        {
          icon: Settings,
          label: "Settings",
          onSelect: () => runCommand(() => navigate("/settings")),
        },
      ],
    },
    {
      heading: "Actions",
      items: [
        {
          icon: Plus,
          label: "Add New Client",
          onSelect: () => runCommand(() => navigate("/clients/new")),
        },
        {
          icon: FileText,
          label: "Create Blog Post",
          onSelect: () => runCommand(() => navigate("/generate?type=blog")),
        },
        {
          icon: Edit,
          label: "Create Social Post",
          onSelect: () => runCommand(() => navigate("/generate?type=social")),
        },
      ],
    },
    {
      heading: "Account",
      items: [
        {
          icon: Settings,
          label: "Account Settings",
          onSelect: () => runCommand(() => navigate("/account/settings")),
        },
        {
          icon: LogOut,
          label: "Sign Out",
          onSelect: () => runCommand(() => console.log("Sign out")),
        },
      ],
    },
  ];

  return (
    <>
      {/* Trigger Button (optional visual indicator) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Palette Dialog */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />

            {/* Command Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="command-palette z-50"
            >
              <Command
                className="bg-card border-border"
                shouldFilter={true}
                value={search}
                onValueChange={setSearch}
              >
                {/* Search Input */}
                <div className="flex items-center border-b border-border px-4 py-3">
                  <Search className="h-5 w-5 text-muted-foreground mr-3" />
                  <Command.Input
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
                    value={search}
                    onValueChange={setSearch}
                  />
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ESC
                  </kbd>
                </div>

                {/* Command List */}
                <Command.List className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                    No results found.
                  </Command.Empty>

                  {commands.map((group) => (
                    <Command.Group
                      key={group.heading}
                      heading={group.heading}
                      className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground"
                    >
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Command.Item
                            key={item.label}
                            onSelect={item.onSelect}
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors data-[selected=true]:bg-muted/50 data-[selected=true]:text-foreground mb-1"
                          >
                            <div className="p-1.5 bg-foreground/5 border border-foreground/10 rounded-md group-data-[selected=true]:bg-foreground/10">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="flex-1 text-sm">{item.label}</span>
                            {item.shortcut && (
                              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                {item.shortcut}
                              </kbd>
                            )}
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer */}
                <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
                        ↑↓
                      </kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
                        ↵
                      </kbd>
                      <span>Select</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Powered by Publisphere</span>
                  </div>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
