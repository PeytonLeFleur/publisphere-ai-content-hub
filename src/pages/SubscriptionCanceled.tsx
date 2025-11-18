import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";

const SubscriptionCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-2xl w-full"
      >
        <motion.div variants={staggerItem}>
          <Card className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 w-fit"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
                <div className="relative p-6 bg-orange-50 dark:bg-orange-950/30 rounded-full border-4 border-orange-200 dark:border-orange-800">
                  <XCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <h1 className="text-4xl font-bold mb-4">
                Subscription Canceled
              </h1>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="text-xl text-muted-foreground mb-8"
            >
              The subscription process was canceled. No charges were made.
            </motion.p>

            <motion.div
              variants={staggerItem}
              className="bg-muted/30 border border-border rounded-lg p-6 mb-8"
            >
              <h3 className="font-semibold mb-3">What happened?</h3>
              <p className="text-sm text-muted-foreground">
                The payment process was interrupted or canceled before completion.
                No subscription was created and no charges were made to the payment method.
              </p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8"
            >
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Want to try again?
              </h3>
              <div className="space-y-2 text-left text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Go back to client management</span>
                </div>
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Click "Subscribe" on the client</span>
                </div>
                <div className="flex items-start gap-2">
                  <RefreshCw className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Complete the Stripe checkout process</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/agency/billing')}
                className="flex-1"
              >
                View Billing
              </Button>
              <Button
                onClick={() => navigate('/clients')}
                className="btn-premium flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Clients
              </Button>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="text-sm text-muted-foreground mt-6"
            >
              Need help? Contact support or check your billing settings.
            </motion.p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SubscriptionCanceled;
