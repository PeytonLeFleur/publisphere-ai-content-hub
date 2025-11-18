import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, Trash2 } from "lucide-react";
import { fadeInUp } from "@/lib/animations";

const ClientEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    address: "",
    industry: "",
    notes: "",
  });

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', user.email)
        .single();

      if (!agency) {
        throw new Error('Agency not found');
      }

      // Load client
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('agency_id', agency.id)
        .single();

      if (error) throw error;

      setFormData({
        businessName: client.business_name || "",
        contactName: client.contact_name || "",
        contactEmail: client.contact_email || "",
        contactPhone: client.contact_phone || "",
        website: client.website || "",
        address: client.address || "",
        industry: client.industry || "",
        notes: client.notes || "",
      });

      setIsLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load client",
        variant: "destructive",
      });
      navigate('/clients');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.contactEmail) {
      toast({
        title: "Validation Error",
        description: "Business name and email are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          business_name: formData.businessName,
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          website: formData.website,
          address: formData.address,
          industry: formData.industry,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client updated successfully",
      });

      navigate(`/clients/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client deleted successfully",
      });

      navigate('/clients');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="skeleton h-12 w-64" />
          <div className="skeleton h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(`/clients/${id}`)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Client
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Edit Client</h1>
            <p className="text-muted-foreground text-lg">
              Update client information
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Acme Corporation"
                      required
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="Technology, Retail, etc."
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, City, State, ZIP"
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="John Doe"
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="john@example.com"
                      required
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Contact Phone
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      disabled={isSubmitting}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information about this client..."
                  rows={4}
                  disabled={isSubmitting}
                  className="mt-2"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/clients/${id}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-premium flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </form>
          </Card>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Delete Client?</h2>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete this client? This action cannot be undone.
                  All associated data, including subscriptions and content, will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Deleting..." : "Delete Client"}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ClientEdit;
