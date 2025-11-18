import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/clients');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

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
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-6 bg-green-50 dark:bg-green-950/30 rounded-full border-4 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={staggerItem}>
              <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
                Subscription Activated!
                <Sparkles className="h-8 w-8 text-yellow-500" />
              </h1>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="text-xl text-muted-foreground mb-8"
            >
              Payment successful. Your client's subscription is now active and ready to use.
            </motion.p>

            <motion.div
              variants={staggerItem}
              className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8"
            >
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                What happens next:
              </h3>
              <div className="space-y-2 text-left text-sm text-green-800 dark:text-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Subscription is active and billing cycle has started</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Client can now generate content immediately</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Monthly usage limits are now in effect</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Automatic renewal on the next billing date</span>
                </div>
              </div>
            </motion.div>

            {sessionId && (
              <motion.div
                variants={staggerItem}
                className="mb-8 p-4 bg-muted/30 rounded-lg"
              >
                <p className="text-xs text-muted-foreground">Session ID</p>
                <p className="font-mono text-sm break-all">{sessionId}</p>
              </motion.div>
            )}

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
                Back to Clients
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="text-sm text-muted-foreground mt-6"
            >
              Redirecting to clients in {countdown} seconds...
            </motion.p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
