import { useState, useEffect } from "react";
import { ClientLayout } from "@/components/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

const ContentCalendar = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [scheduledContent, setScheduledContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  useEffect(() => {
    fetchScheduledContent();
  }, []);

  const fetchScheduledContent = async () => {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .not("scheduled_for", "is", null)
        .order("scheduled_for", { ascending: true });

      if (error) throw error;

      setScheduledContent(data || []);
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

  const getContentForDate = (date: Date) => {
    return scheduledContent.filter((item) =>
      isSameDay(new Date(item.scheduled_for), date)
    );
  };

  const datesWithContent = scheduledContent.map(
    (item) => new Date(item.scheduled_for)
  );

  const selectedDateContent = selectedDate
    ? getContentForDate(selectedDate)
    : [];

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Content Calendar</h1>
            <p className="text-muted-foreground">
              View and manage scheduled content
            </p>
          </div>
          <Button asChild>
            <Link to="/generate">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Content
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasContent: datesWithContent,
                }}
                modifiersStyles={{
                  hasContent: {
                    fontWeight: "bold",
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                  },
                }}
              />
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                </h3>
              </div>

              {isLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : selectedDateContent.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No content scheduled for this date
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateContent.map((item) => (
                    <Link
                      key={item.id}
                      to={`/content/${item.id}`}
                      className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-medium line-clamp-2">
                          {item.title || "Untitled"}
                        </h4>
                        <Badge variant="outline" className="ml-2 shrink-0">
                          {item.type === "gmb_post" ? "GMB" : "Article"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.scheduled_for), "h:mm a")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Upcoming Content */}
            <Card className="p-4">
              <h3 className="mb-4 font-semibold">Upcoming (Next 7 Days)</h3>
              {scheduledContent
                .filter((item) => {
                  const itemDate = new Date(item.scheduled_for);
                  const now = new Date();
                  const sevenDaysLater = new Date();
                  sevenDaysLater.setDate(now.getDate() + 7);
                  return itemDate >= now && itemDate <= sevenDaysLater;
                })
                .slice(0, 5)
                .map((item) => (
                  <Link
                    key={item.id}
                    to={`/content/${item.id}`}
                    className="mb-3 block rounded-lg border border-border p-3 transition-colors hover:bg-accent last:mb-0"
                  >
                    <h4 className="mb-1 font-medium line-clamp-1">
                      {item.title || "Untitled"}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(item.scheduled_for), "MMM d, h:mm a")}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.type === "gmb_post" ? "GMB" : "Article"}
                      </Badge>
                    </div>
                  </Link>
                ))}
            </Card>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ContentCalendar;
