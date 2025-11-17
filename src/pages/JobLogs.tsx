import { useState, useEffect } from "react";
import { ClientLayout } from "@/components/ClientLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInSeconds } from "date-fns";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Trash,
  Eye
} from "lucide-react";

const JobLogs = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const agencyBranding = {
    name: "Demo Agency",
    primary_color: "#3B82F6"
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, typeFilter]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("jobs")
        .select("*, content_items(title)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("job_type", typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setJobs(data || []);
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

  const handleRetryJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "pending",
          attempts: 0,
          error_message: null,
        })
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job queued for retry",
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-secondary" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getJobTypeLabel = (type: string) => {
    const labels = {
      publish_article: "Publish Article",
      publish_gmb: "Publish GMB",
      send_email: "Send Email",
      generate_content: "Generate Content"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const calculateDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt || !completedAt) return "-";
    const seconds = differenceInSeconds(new Date(completedAt), new Date(startedAt));
    return `${seconds}s`;
  };

  const viewJobDetails = (job: any) => {
    setSelectedJob(job);
    setShowDetailsDialog(true);
  };

  return (
    <ClientLayout agencyBranding={agencyBranding}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Job Logs</h1>
          <p className="text-muted-foreground">
            Monitor and manage background jobs
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="publish_article">Publish Article</SelectItem>
              <SelectItem value="publish_gmb">Publish GMB</SelectItem>
              <SelectItem value="send_email">Send Email</SelectItem>
              <SelectItem value="generate_content">Generate Content</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchJobs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Jobs Table */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">Loading jobs...</div>
          </Card>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Jobs will appear here when they are created"}
            </p>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getJobStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getJobTypeLabel(job.job_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.content_items?.title || "N/A"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(job.created_at), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      {calculateDuration(job.started_at, job.completed_at)}
                    </TableCell>
                    <TableCell>
                      {job.attempts}/{job.max_attempts}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewJobDetails(job)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {job.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Job Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>
                View detailed information about this job
              </DialogDescription>
            </DialogHeader>

            {selectedJob && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Job ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedJob.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm capitalize">{selectedJob.status}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm">{getJobTypeLabel(selectedJob.job_type)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Attempts</Label>
                    <p className="text-sm">
                      {selectedJob.attempts}/{selectedJob.max_attempts}
                    </p>
                  </div>
                </div>

                {selectedJob.error_message && (
                  <div>
                    <Label className="text-sm font-medium text-destructive">Error Message</Label>
                    <Card className="mt-2 p-4 bg-destructive/10">
                      <p className="text-sm font-mono">{selectedJob.error_message}</p>
                    </Card>
                  </div>
                )}

                {selectedJob.job_data && (
                  <div>
                    <Label className="text-sm font-medium">Job Data</Label>
                    <Card className="mt-2 p-4 bg-muted">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedJob.job_data, null, 2)}
                      </pre>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
};

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={className}>{children}</div>
);

export default JobLogs;
