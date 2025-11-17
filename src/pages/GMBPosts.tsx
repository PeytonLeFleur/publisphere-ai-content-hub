import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FileText, TrendingUp, Clock, Copy, Trash2, Edit, Send, Download, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GMBPost {
  id: string;
  content: string;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  cta_type: string | null;
  emoji_count: number | null;
  character_count: number | null;
  performance_views: number | null;
  performance_clicks: number | null;
  created_at: string;
}

const GMBPosts = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<GMBPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<GMBPost | null>(null);
  const [editingStats, setEditingStats] = useState<{ views: string; clicks: string }>({ views: "", clicks: "" });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userData.user.email)
        .single();

      if (!client) return;

      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('client_id', client.id)
        .eq('type', 'gmb_post')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const draftPosts = posts.filter(p => p.status === 'draft');
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const publishedPosts = posts.filter(p => p.status === 'published');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Post content copied to clipboard"
    });
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPosts(posts.filter(p => p.id !== id));
      toast({
        title: "Post deleted",
        description: "The post has been removed"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const markAsPublished = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      await loadPosts();
      toast({
        title: "Post published",
        description: "The post has been marked as published"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const savePerformanceStats = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update({
          performance_views: parseInt(editingStats.views) || 0,
          performance_clicks: parseInt(editingStats.clicks) || 0
        })
        .eq('id', postId);

      if (error) throw error;
      
      await loadPosts();
      setSelectedPost(null);
      toast({
        title: "Stats saved",
        description: "Performance stats have been updated"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const PostCard = ({ post, showSchedule = false, showPerformance = false }: { post: GMBPost; showSchedule?: boolean; showPerformance?: boolean }) => (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm line-clamp-3">{post.content}</p>
            <div className="flex gap-2 mt-2">
              {post.cta_type && (
                <Badge variant="outline">{post.cta_type}</Badge>
              )}
              {post.emoji_count && post.emoji_count > 0 && (
                <Badge variant="secondary">{post.emoji_count} emojis</Badge>
              )}
              {post.character_count && (
                <Badge variant="secondary">{post.character_count} chars</Badge>
              )}
            </div>
          </div>
        </div>

        {showSchedule && post.scheduled_for && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled: {new Date(post.scheduled_for).toLocaleDateString()}
          </div>
        )}

        {showPerformance && (
          <div className="border-t pt-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedPost(post);
                  setEditingStats({
                    views: post.performance_views?.toString() || "",
                    clicks: post.performance_clicks?.toString() || ""
                  });
                }}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {post.performance_views ? "Update Stats" : "Add Stats"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Performance Stats</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Views</Label>
                    <Input
                      type="number"
                      value={editingStats.views}
                      onChange={(e) => setEditingStats({ ...editingStats, views: e.target.value })}
                      placeholder="Enter view count"
                    />
                  </div>
                  <div>
                    <Label>Clicks</Label>
                    <Input
                      type="number"
                      value={editingStats.clicks}
                      onChange={(e) => setEditingStats({ ...editingStats, clicks: e.target.value })}
                      placeholder="Enter click count"
                    />
                  </div>
                  <Button onClick={() => savePerformanceStats(post.id)}>
                    Save Stats
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {post.performance_views && (
              <div className="text-sm text-muted-foreground mt-2">
                {post.performance_views} views • {post.performance_clicks} clicks
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(post.content)}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          {post.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsPublished(post.id)}
            >
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
          )}
          {post.status === 'scheduled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsPublished(post.id)}
            >
              <Send className="h-4 w-4 mr-1" />
              Publish Now
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deletePost(post.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const totalPublished = publishedPosts.length;
  const totalViews = publishedPosts.reduce((sum, p) => sum + (p.performance_views || 0), 0);
  const totalClicks = publishedPosts.reduce((sum, p) => sum + (p.performance_clicks || 0), 0);
  const avgEngagement = totalPublished > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">GMB Posts</h1>
            <p className="text-muted-foreground">Manage your Google My Business posts</p>
          </div>
          <Button onClick={() => window.location.href = '/generate'}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate New Post
          </Button>
        </div>

        <Tabs defaultValue="drafts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="drafts">
              <FileText className="h-4 w-4 mr-2" />
              Drafts ({draftPosts.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              <Clock className="h-4 w-4 mr-2" />
              Scheduled ({scheduledPosts.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              <Send className="h-4 w-4 mr-2" />
              Published ({publishedPosts.length})
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-4">
            {draftPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">No draft posts</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draftPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">No scheduled posts</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledPosts.map(post => (
                  <PostCard key={post.id} post={post} showSchedule />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4">
            {publishedPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">No published posts</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedPosts.map(post => (
                  <PostCard key={post.id} post={post} showPerformance />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-6">
                <div className="text-2xl font-bold">{totalPublished}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </Card>
              <Card className="p-6">
                <div className="text-2xl font-bold">{totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </Card>
              <Card className="p-6">
                <div className="text-2xl font-bold">{totalClicks}</div>
                <div className="text-sm text-muted-foreground">Total Clicks</div>
              </Card>
              <Card className="p-6">
                <div className="text-2xl font-bold">{avgEngagement}%</div>
                <div className="text-sm text-muted-foreground">Avg Engagement</div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold">Coming Soon</span>
                <Badge>Auto-sync with GMB</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your Google My Business account for automatic performance tracking and publishing.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GMBPosts;
