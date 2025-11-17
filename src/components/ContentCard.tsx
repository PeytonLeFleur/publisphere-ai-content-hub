import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MessageSquare, MoreVertical, Eye, Edit, Copy, Trash } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface ContentCardProps {
  id: string;
  type: string;
  title: string | null;
  content: string;
  status: string;
  created_at: string;
  scheduled_for: string | null;
  published_at: string | null;
  featured_image_url: string | null;
  character_count: number | null;
  wordpress_site_id: string | null;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary text-primary-foreground",
  published: "bg-secondary text-secondary-foreground",
  failed: "bg-destructive text-destructive-foreground",
};

export const ContentCard = ({
  id,
  type,
  title,
  content,
  status,
  created_at,
  scheduled_for,
  published_at,
  featured_image_url,
  character_count,
  onDelete,
  onDuplicate,
}: ContentCardProps) => {
  const contentPreview = content.replace(/<[^>]*>/g, "").substring(0, 100);
  const wordCount = content.split(/\s+/).length;

  return (
    <Card className="overflow-hidden hover:shadow-card transition-shadow">
      {/* Image */}
      <div className="relative h-40 bg-muted">
        {featured_image_url ? (
          <img 
            src={featured_image_url} 
            alt={title || "Content"} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {type === "gmb_post" ? (
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            ) : (
              <FileText className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Type and Status */}
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {type === "gmb_post" ? "GMB Post" : "Article"}
          </Badge>
          <Badge className={statusColors[status as keyof typeof statusColors]}>
            {status}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 font-semibold">
          {title || "Untitled"}
        </h3>

        {/* Preview */}
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {contentPreview}...
        </p>

        {/* Meta */}
        <div className="mb-3 text-xs text-muted-foreground">
          {type === "gmb_post" ? (
            <span>{character_count || 0} characters</span>
          ) : (
            <span>{wordCount} words</span>
          )}
          {" • "}
          {scheduled_for && (
            <span>Scheduled: {format(new Date(scheduled_for), "MMM d")}</span>
          )}
          {published_at && (
            <span>Published: {format(new Date(published_at), "MMM d")}</span>
          )}
          {!scheduled_for && !published_at && (
            <span>Created: {format(new Date(created_at), "MMM d")}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/content/${id}`}>
              <Eye className="mr-1 h-4 w-4" />
              View
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/content/${id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(id)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};
