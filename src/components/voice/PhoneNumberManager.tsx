import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Plus, Trash2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import type { VoiceAgentPhoneNumber } from "@/types/voiceAgent";

export const PhoneNumberManager = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<VoiceAgentPhoneNumber[]>([]);
  const [areaCode, setAreaCode] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [showProvisionForm, setShowProvisionForm] = useState(false);

  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  const loadPhoneNumbers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('contact_email', user.email)
        .single();

      if (!agency) return;

      const { data, error } = await supabase
        .from('voice_agent_phone_numbers')
        .select(`
          *,
          clients (
            business_name
          )
        `)
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPhoneNumbers(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      setIsLoading(false);
    }
  };

  const handleProvisionNumber = async () => {
    if (areaCode && (areaCode.length !== 3 || !/^\d{3}$/.test(areaCode))) {
      toast({
        title: "Invalid area code",
        description: "Area code must be exactly 3 digits (e.g., 415, 212, 310)",
        variant: "destructive",
      });
      return;
    }

    setIsProvisioning(true);

    try {
      const { data, error } = await supabase.functions.invoke('provision-phone-number', {
        body: {
          area_code: areaCode || undefined,
          country_code: 'US',
          friendly_name: friendlyName || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: `Phone number ${data.phone_number.phone_number} provisioned successfully`,
        });

        setAreaCode("");
        setFriendlyName("");
        setShowProvisionForm(false);
        loadPhoneNumbers();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to provision phone number",
        variant: "destructive",
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleReleaseNumber = async (phoneNumberId: string, phoneNumber: string) => {
    if (!confirm(`Are you sure you want to release ${phoneNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('voice_agent_phone_numbers')
        .update({ status: 'released' })
        .eq('id', phoneNumberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Phone number released successfully",
      });

      loadPhoneNumbers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to release phone number",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-96 w-full" />
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Phone className="h-8 w-8" />
            Phone Numbers
          </h2>
          <p className="text-muted-foreground mt-1">
            Provision and manage Twilio phone numbers for your voice agents
          </p>
        </div>

        <Button
          onClick={() => setShowProvisionForm(!showProvisionForm)}
          className="btn-premium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Provision Number
        </Button>
      </div>

      {/* Provision Form */}
      {showProvisionForm && (
        <Card className="p-6 border-primary/50">
          <h3 className="text-xl font-semibold mb-4">Provision New Phone Number</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="areaCode">
                Area Code (Optional)
              </Label>
              <Input
                id="areaCode"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g., 415, 212, 310"
                className="mt-2"
                disabled={isProvisioning}
                maxLength={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to get any available US number
              </p>
            </div>

            <div>
              <Label htmlFor="friendlyName">
                Friendly Name (Optional)
              </Label>
              <Input
                id="friendlyName"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
                placeholder="e.g., Main Support Line"
                className="mt-2"
                disabled={isProvisioning}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleProvisionNumber}
                disabled={isProvisioning}
                className="btn-premium"
              >
                {isProvisioning ? "Provisioning..." : "Provision Number"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowProvisionForm(false);
                  setAreaCode("");
                  setFriendlyName("");
                }}
                disabled={isProvisioning}
              >
                Cancel
              </Button>

              <p className="text-sm text-muted-foreground ml-auto">
                Cost: $1.15/month
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Phone Numbers List */}
      {phoneNumbers.length === 0 ? (
        <Card className="p-12 text-center">
          <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No phone numbers yet</h3>
          <p className="text-muted-foreground mb-6">
            Provision your first phone number to start creating voice agents
          </p>
          <Button
            onClick={() => setShowProvisionForm(true)}
            className="btn-premium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Provision Your First Number
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {phoneNumbers.map((number) => (
            <Card key={number.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-semibold font-mono">
                      {number.phone_number}
                    </h4>
                    {number.status === 'active' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                        {number.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    {number.friendly_name && (
                      <span>{number.friendly_name}</span>
                    )}
                    {number.client_id && (number as any).clients && (
                      <span className="flex items-center gap-1">
                        Assigned to: <strong>{(number as any).clients.business_name}</strong>
                      </span>
                    )}
                    {!number.client_id && (
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Not assigned to any voice agent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Monthly Cost: ${(number.monthly_cost_cents / 100).toFixed(2)}</span>
                    <span>Twilio SID: {number.twilio_sid}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {number.status === 'active' && !number.client_id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReleaseNumber(number.id, number.phone_number)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Release
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <AlertCircle className="h-5 w-5" />
          Phone Number Information
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• Phone numbers cost $1.15/month through Twilio</p>
          <p>• Numbers are provisioned instantly and ready to use</p>
          <p>• Each voice agent requires one dedicated phone number</p>
          <p>• You can release unused numbers to stop monthly charges</p>
          <p>• Numbers cannot be released while assigned to an active voice agent</p>
        </div>
      </Card>
    </motion.div>
  );
};
