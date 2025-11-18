import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PackageBuilder } from "@/components/packages/PackageBuilder";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";

const ServicePackages = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("packages");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/agency/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agency Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Service Packages</h1>
            <p className="text-muted-foreground text-lg">
              Create custom service packages with your own pricing for your clients
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="packages">My Packages</TabsTrigger>
              <TabsTrigger value="create">Create Package</TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="space-y-6">
              <div className="text-center py-12 text-muted-foreground">
                Package list coming soon...
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <PackageBuilder onSuccess={() => setActiveTab("packages")} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicePackages;
