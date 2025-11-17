import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { FileText, MessageSquare, Globe, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ContentType = 'blog_article' | 'gmb_post' | 'service_page' | null;
type GenerationStep = 1 | 2 | 3 | 4;

interface BlogParams {
  topic: string;
  wordCount: number;
  tone: string;
  targetAudience: string;
  includeFaq: boolean;
  titleOptions: number;
}

interface GmbParams {
  topic: string;
  postType: string;
  ctaButton: string;
  includeEmoji: boolean;
}

const ContentGeneration = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<GenerationStep>(1);
  const [contentType, setContentType] = useState<ContentType>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [blogParams, setBlogParams] = useState<BlogParams>({
    topic: "",
    wordCount: 2000,
    tone: "professional",
    targetAudience: "",
    includeFaq: true,
    titleOptions: 5
  });

  const [gmbParams, setGmbParams] = useState<GmbParams>({
    topic: "",
    postType: "whats_new",
    ctaButton: "learn_more",
    includeEmoji: true
  });

  const [generatedOutline, setGeneratedOutline] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const contentTypes = [
    {
      type: 'blog_article' as ContentType,
      icon: FileText,
      title: "Blog Article",
      description: "Long-form SEO-optimized content (1500-3000 words)",
      color: "primary"
    },
    {
      type: 'gmb_post' as ContentType,
      icon: MessageSquare,
      title: "GMB Post",
      description: "Short, engaging post for Google Business",
      color: "secondary"
    },
    {
      type: 'service_page' as ContentType,
      icon: Globe,
      title: "Service Page",
      description: "Conversion-focused service page",
      color: "accent"
    }
  ];

  const handleContentTypeSelect = (type: ContentType) => {
    setContentType(type);
    setStep(2);
  };

  const handleGenerateOutline = async () => {
    if (!blogParams.topic) {
      toast({
        title: "Missing topic",
        description: "Please enter a topic or keyword.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          action: 'generate_outline',
          content_type: contentType,
          params: blogParams
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedOutline(data.outline);
        setStep(3);
      } else {
        throw new Error(data.error || 'Failed to generate outline');
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate outline. Please check your API keys.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFull = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          action: 'generate_full',
          content_type: contentType,
          params: contentType === 'blog_article' ? { ...blogParams, outline: generatedOutline } : gmbParams
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedContent(data.content);
        setStep(4);
      } else {
        throw new Error(data.error || 'Failed to generate content');
      }
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateGmbPost = async () => {
    if (!gmbParams.topic) {
      toast({
        title: "Missing topic",
        description: "Please enter a post topic.",
        variant: "destructive"
      });
      return;
    }

    await handleGenerateFull();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar agencyBranding={{ name: "Demo Agency", primary_color: "#3B82F6" }} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Content Generation
          </h1>
          <p className="text-muted-foreground text-lg">
            Create SEO-optimized content using your own AI API keys
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors
                ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {s}
              </div>
              {s < 4 && (
                <div className={`w-20 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Content Type */}
        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-6">
            {contentTypes.map((ct) => {
              const Icon = ct.icon;
              return (
                <Card
                  key={ct.type}
                  className="p-8 glass-effect cursor-pointer hover:shadow-premium transition-all group"
                  onClick={() => handleContentTypeSelect(ct.type)}
                >
                  <div className={`p-4 bg-${ct.color}/10 rounded-lg w-fit mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-12 w-12 text-${ct.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-center mb-3">{ct.title}</h3>
                  <p className="text-muted-foreground text-center mb-6">{ct.description}</p>
                  <Button className="w-full">
                    Select <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Step 2: Content Details */}
        {step === 2 && contentType === 'blog_article' && (
          <Card className="p-8 glass-effect max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Blog Article Details</h2>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="topic">Topic / Main Keyword *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Best practices for local SEO"
                  value={blogParams.topic}
                  onChange={(e) => setBlogParams({ ...blogParams, topic: e.target.value })}
                />
              </div>

              <div>
                <Label>Target Word Count: {blogParams.wordCount} words</Label>
                <Slider
                  min={1500}
                  max={3000}
                  step={100}
                  value={[blogParams.wordCount]}
                  onValueChange={(value) => setBlogParams({ ...blogParams, wordCount: value[0] })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select
                  value={blogParams.tone}
                  onValueChange={(value) => setBlogParams({ ...blogParams, tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Small business owners, Homeowners"
                  value={blogParams.targetAudience}
                  onChange={(e) => setBlogParams({ ...blogParams, targetAudience: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="faq">Include FAQ Section</Label>
                <Switch
                  id="faq"
                  checked={blogParams.includeFaq}
                  onCheckedChange={(checked) => setBlogParams({ ...blogParams, includeFaq: checked })}
                />
              </div>

              <div>
                <Label htmlFor="titleOptions">Number of Title Options</Label>
                <Select
                  value={blogParams.titleOptions.toString()}
                  onValueChange={(value) => setBlogParams({ ...blogParams, titleOptions: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 options</SelectItem>
                    <SelectItem value="5">5 options</SelectItem>
                    <SelectItem value="10">10 options</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateOutline}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Outline...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Outline
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && contentType === 'gmb_post' && (
          <Card className="p-8 glass-effect max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">GMB Post Details</h2>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="gmbTopic">Post Topic *</Label>
                <Input
                  id="gmbTopic"
                  placeholder="e.g., Summer sale announcement"
                  value={gmbParams.topic}
                  onChange={(e) => setGmbParams({ ...gmbParams, topic: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="postType">Post Type</Label>
                <Select
                  value={gmbParams.postType}
                  onValueChange={(value) => setGmbParams({ ...gmbParams, postType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whats_new">What's New</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cta">CTA Button</Label>
                <Select
                  value={gmbParams.ctaButton}
                  onValueChange={(value) => setGmbParams({ ...gmbParams, ctaButton: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="learn_more">Learn More</SelectItem>
                    <SelectItem value="sign_up">Sign Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emoji">Include Emoji</Label>
                <Switch
                  id="emoji"
                  checked={gmbParams.includeEmoji}
                  onCheckedChange={(checked) => setGmbParams({ ...gmbParams, includeEmoji: checked })}
                />
              </div>

              <Button
                onClick={handleGenerateGmbPost}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Post...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Post
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Review Outline */}
        {step === 3 && contentType === 'blog_article' && generatedOutline && (
          <Card className="p-8 glass-effect max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Review Outline</h2>
            
            <div className="bg-muted/50 p-6 rounded-lg mb-6 whitespace-pre-wrap font-mono text-sm">
              {generatedOutline}
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back to Edit
              </Button>
              <Button onClick={handleGenerateOutline} variant="outline" disabled={isGenerating}>
                Regenerate Outline
              </Button>
              <Button onClick={handleGenerateFull} disabled={isGenerating} className="ml-auto">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Full Article...
                  </>
                ) : (
                  "Generate Full Article"
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Review Full Content */}
        {step === 4 && generatedContent && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-8 glass-effect">
              <h2 className="text-2xl font-bold mb-6">Generated Content</h2>
              
              <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.html }} />

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(contentType === 'blog_article' ? 3 : 2)}>
                  Back
                </Button>
                <Button variant="outline">Edit Content</Button>
                <Button variant="outline">Regenerate</Button>
                <Button className="ml-auto">Save as Draft</Button>
                <Button>Publish Now</Button>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 glass-effect">
                <h3 className="font-semibold mb-4">Title Options</h3>
                {generatedContent.titles?.map((title: string, index: number) => (
                  <label key={index} className="flex items-start gap-3 mb-3 cursor-pointer">
                    <input type="radio" name="title" className="mt-1" defaultChecked={index === 0} />
                    <span className="text-sm">{title}</span>
                  </label>
                ))}
              </Card>

              <Card className="p-6 glass-effect">
                <h3 className="font-semibold mb-4">SEO Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="metaDesc">Meta Description</Label>
                    <Textarea
                      id="metaDesc"
                      maxLength={155}
                      defaultValue={generatedContent.meta_description}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {generatedContent.meta_description?.length || 0}/155 characters
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="keyword">Focus Keyword</Label>
                    <Input id="keyword" defaultValue={generatedContent.focus_keyword} />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentGeneration;
