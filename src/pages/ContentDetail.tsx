import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/ClientLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  Trash, 
  Calendar, 
  FileText,
  DollarSign
} from "lucide-react";

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  useEffect(() => {
    if (id) fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setContent(data);
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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });

      navigate("/content");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async () => {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .insert({
          ...content,
          id: undefined,
          title: `${content.title} (Copy)`,
          status: "draft",
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content duplicated successfully",
      });

      navigate(`/content/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <ClientLayout agencyBranding={agencyBranding}>
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading content...</div>
        </div>
      </ClientLayout>
    );
  }

  if (!content) {
    return (
      <ClientLayout agencyBranding={agencyBranding}>
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="mb-2 text-lg font-semibold">Content not found</h2>
          <Button asChild>
            <Link to="/content">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Link>
          </Button>
        </div>
      </ClientLayout>
    );
  }

  const wordCount = content.content.split(/\s+/).length;

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/content">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold">
                {content.title || "Untitled"}
              </h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={content.status} />
                {content.type === "gmb_post" && (
                  <span className="text-sm text-muted-foreground">
                    {content.character_count || 0} characters
                  </span>
                )}
                {content.type !== "gmb_post" && (
                  <span className="text-sm text-muted-foreground">
                    {wordCount} words
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={`/content/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {content.featured_image_url && (
              <div className="mb-6">
                <img
                  src={content.featured_image_url}
                  alt={content.title || "Featured image"}
                  className="w-full rounded-lg"
                />
              </div>
            )}

            <Card className="p-6">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            </Card>

            {content.meta_description && (
              <Card className="mt-4 bg-muted p-4">
                <h3 className="mb-2 text-sm font-semibold">Meta Description</h3>
                <p className="text-sm text-muted-foreground">
                  {content.meta_description}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-4 font-semibold">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {format(new Date(content.created_at), "MMM d, yyyy")}
                  </span>
                </div>

                {content.updated_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last edited</span>
                    <span>
                      {format(new Date(content.updated_at), "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                {content.scheduled_for && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Scheduled for</span>
                      <span className="font-medium">
                        {format(new Date(content.scheduled_for), "MMM d, yyyy")}
                      </span>
                    </div>
                  </>
                )}

                {content.published_at && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Published</span>
                      <span className="font-medium">
                        {format(new Date(content.published_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="capitalize">
                    {content.type.replace("_", " ")}
                  </span>
                </div>

                {content.estimated_api_cost && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">API Cost</span>
                      <span className="font-mono">
                        ${content.estimated_api_cost.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {content.focus_keyword && (
              <Card className="p-4">
                <h3 className="mb-2 font-semibold">Focus Keyword</h3>
                <p className="text-sm">{content.focus_keyword}</p>
              </Card>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ClientLayout>
  );
};

export default ContentDetail;
