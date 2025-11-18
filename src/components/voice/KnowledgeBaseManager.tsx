import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Trash2, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import type { KnowledgeBaseFile } from "@/types/voiceAgent";

interface KnowledgeBaseManagerProps {
  clientId: string;
}

export const KnowledgeBaseManager = ({ clientId }: KnowledgeBaseManagerProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadKnowledgeBaseFiles();

    // Subscribe to real-time updates for embedding status
    const subscription = supabase
      .channel('knowledge_base_files_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'knowledge_base_files',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          setFiles((currentFiles) =>
            currentFiles.map((file) =>
              file.id === payload.new.id ? (payload.new as KnowledgeBaseFile) : file
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clientId]);

  const loadKnowledgeBaseFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFiles(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading knowledge base files:', error);
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/markdown',
        'application/json'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Supported formats: .txt, .pdf, .docx, .md, .json",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('client_id', clientId);

      const { data, error } = await supabase.functions.invoke('upload-knowledge-file', {
        body: formData,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "File uploaded successfully. Processing embeddings...",
        });

        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        loadKnowledgeBaseFiles();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This will also remove all associated embeddings.`)) {
      return;
    }

    try {
      // Delete embeddings first
      const { error: embeddingsError } = await supabase
        .from('knowledge_base_embeddings')
        .delete()
        .eq('file_id', fileId);

      if (embeddingsError) throw embeddingsError;

      // Delete file record
      const { error: fileError } = await supabase
        .from('knowledge_base_files')
        .delete()
        .eq('id', fileId);

      if (fileError) throw fileError;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      loadKnowledgeBaseFiles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Knowledge Base Files
        </h3>
        <p className="text-muted-foreground mt-1">
          Upload documents that your voice agent will use to answer questions
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  TXT, PDF, DOCX, MD, JSON (Max 10MB)
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".txt,.pdf,.docx,.md,.json"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="btn-premium"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Files List */}
      {files.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No knowledge base files yet</h3>
          <p className="text-muted-foreground">
            Upload documents to provide your voice agent with business-specific knowledge
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {files.map((file) => (
            <Card key={file.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{file.file_name}</h4>
                    {getStatusBadge(file.embedding_status)}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>{file.chunk_count} chunks</span>
                    <span>Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
                  </div>

                  {file.summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {file.summary}
                    </p>
                  )}

                  {file.embedding_error && (
                    <p className="text-sm text-destructive mt-2">
                      Error: {file.embedding_error}
                    </p>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteFile(file.id, file.file_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};
