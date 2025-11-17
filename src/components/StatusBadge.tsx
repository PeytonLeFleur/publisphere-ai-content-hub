import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  published: {
    label: "Published",
    className: "bg-secondary/10 text-secondary border-secondary/20",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  
  return (
    <Badge 
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};
