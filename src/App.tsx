import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AgencyBrandingProvider } from "@/contexts/AgencyBrandingContext";
import { CommandPalette } from "@/components/CommandPalette";

const Landing = lazy(() => import("./pages/Landing"));
const AgencySignup = lazy(() => import("./pages/AgencySignup"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const AgencyDashboard = lazy(() => import("./pages/AgencyDashboard"));
const AgencyBilling = lazy(() => import("./pages/AgencyBilling"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientManagement = lazy(() => import("./pages/ClientManagement"));
const ClientNew = lazy(() => import("./pages/ClientNew"));
const ClientView = lazy(() => import("./pages/ClientView"));
const ClientEdit = lazy(() => import("./pages/ClientEdit"));
const ContentGenerator = lazy(() => import("./pages/ContentGenerator"));
const ContentLibrary = lazy(() => import("./pages/ContentLibrary"));
const ContentDetail = lazy(() => import("./pages/ContentDetail"));
const ContentCalendar = lazy(() => import("./pages/ContentCalendar"));
const Automation = lazy(() => import("./pages/Automation"));
const JobLogs = lazy(() => import("./pages/JobLogs"));
const GMBPosts = lazy(() => import("./pages/GMBPosts"));
const Settings = lazy(() => import("./pages/Settings"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const Help = lazy(() => import("./pages/Help"));
const ApiKeysSettings = lazy(() => import("./pages/ApiKeysSettings"));
const AgencyApiSettings = lazy(() => import("./pages/AgencyApiSettings"));
const WordPressSettings = lazy(() => import("./pages/WordPressSettings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("./pages/SubscriptionCanceled"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const VoiceAgents = lazy(() => import("./pages/VoiceAgents"));
const ClientVoiceAgents = lazy(() => import("./pages/ClientVoiceAgents"));
const ServicePackages = lazy(() => import("./pages/ServicePackages"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AgencyBrandingProvider>
          <CommandPalette />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="skeleton h-12 w-12 rounded-full mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup/agency" element={<AgencySignup />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<ClientLogin />} />
            <Route path="/agency/dashboard" element={<AgencyDashboard />} />
            <Route path="/agency/billing" element={<AgencyBilling />} />
            <Route path="/agency/api-settings" element={<AgencyApiSettings />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/clients/new" element={<ClientNew />} />
            <Route path="/clients/:id" element={<ClientView />} />
            <Route path="/clients/:id/edit" element={<ClientEdit />} />
            <Route path="/clients/:id/voice-agents" element={<ClientVoiceAgents />} />
            <Route path="/voice-agents" element={<VoiceAgents />} />
            <Route path="/service-packages" element={<ServicePackages />} />
            <Route path="/generate" element={<ContentGenerator />} />
            <Route path="/content" element={<ContentLibrary />} />
            <Route path="/content/:id" element={<ContentDetail />} />
            <Route path="/calendar" element={<ContentCalendar />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/jobs" element={<JobLogs />} />
            <Route path="/gmb-posts" element={<GMBPosts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/api-keys" element={<ApiKeysSettings />} />
            <Route path="/settings/wordpress" element={<WordPressSettings />} />
            <Route path="/settings/notifications" element={<NotificationSettings />} />
            <Route path="/help" element={<Help />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/canceled" element={<SubscriptionCanceled />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </AgencyBrandingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
